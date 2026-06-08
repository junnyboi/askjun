# Hybrid RAG Knowledge Base — Implementation Plan

---

## Understanding

Restructure the monolithic `server/knowledge.ts` (236 lines, 19KB, ~8,000 tokens) into modular frontmatter markdown files with a keyword-based retrieval router. The system will only inject relevant chunks into the LLM context, reducing token consumption by ~50-65% per call. Files are structured with `content_hash` fields to enable future vector embedding migration (LangGraph/pgvector) without re-architecting.

**Non-goals:**
- No vector database or embedding model in this phase
- No LangGraph dependency yet
- No changes to the client-side fallback engine (`chatEngine.ts`)
- No changes to the frontend UI or chat UX

---

## Relevant Code

| File | Why It Matters |
|------|---------------|
| `server/knowledge.ts` | The monolithic system prompt being decomposed (236 lines, deleted after migration) |
| `server/routers.ts` (line 86) | The only consumer — imports `SYSTEM_PROMPT` and injects into LLM messages |
| `client/src/data/chatEngine.ts` | Client-side fallback — has its own `KEYWORD_MAP` pattern we can mirror server-side |
| `client/src/data/followUps.ts` | Also uses keyword mapping — validates the pattern works |
| `package.json` | Need to add `gray-matter` for frontmatter parsing + `crypto` for content hashing |

---

## Proposed Approach

**Phase 1:** Create a `server/knowledge/` directory with 20 markdown files, each containing a focused knowledge chunk with YAML frontmatter (id, keywords, priority, tokens, content_hash).

**Phase 2:** Build a `server/knowledge/router.ts` module that loads all files at server start, parses frontmatter, and exposes a `getRelevantContext(query)` function that returns the system personality + top 2-3 matching chunks.

**Phase 3:** Replace the static `SYSTEM_PROMPT` import in `server/routers.ts` with the dynamic `getRelevantContext(query)` call.

**Phase 4:** Delete the old `server/knowledge.ts` and verify no regressions.

---

## File-Level Plan

### New Files

```
server/knowledge/
├── _system.md              # Personality + rules (ALWAYS included)
├── summary.md              # Professional summary + key metrics
├── role-meta.md            # Meta/Manus current role
├── role-instawork.md       # Instawork experience
├── role-hoyoverse.md       # HoYoverse experience
├── role-tiktok.md          # TikTok/ByteDance experience
├── role-bos.md             # Bank of Singapore experience
├── role-dbs.md             # DBS Bank experience
├── skills.md               # Technical skills
├── education.md            # Education + certifications
├── awards.md               # Awards & recognition
├── projects-games.md       # Game dev portfolio (8 games)
├── projects-apps.md        # Trident, Swipe, Mijun, Housewarmer
├── company-meta.md         # Meta/Manus company context
├── company-hoyoverse.md    # HoYoverse company context
├── company-tiktok.md       # TikTok/ByteDance company context
├── company-bos.md          # Bank of Singapore company context
├── why-hire.md             # The 30-second pitch
├── personal.md             # Background, personality, interests
├── contact.md              # All contact info
├── easter-eggs.md          # Appearance, fun facts
└── router.ts               # The retrieval router module
```

### Modified Files

| File | Change |
|------|--------|
| `server/routers.ts` | Replace `import { SYSTEM_PROMPT } from "./knowledge"` with `import { getRelevantContext } from "./knowledge/router"` |
| `package.json` | Add `gray-matter` dependency |

### Deleted Files

| File | Reason |
|------|--------|
| `server/knowledge.ts` | Replaced by the `server/knowledge/` directory |

---

## Data Flow

```
User sends message
        │
        ▼
server/routers.ts → chat.send mutation
        │
        ├── Extract the latest user query (last message)
        │
        ▼
server/knowledge/router.ts → getRelevantContext(query)
        │
        ├── 1. Always include _system.md (~800 tokens)
        ├── 2. Score all other .md files by keyword match
        ├── 3. Return top 3 by score (or all with score > 0)
        ├── 4. Concatenate: system + matched chunks
        │
        ▼
Assembled context string (~2,000-3,000 tokens)
        │
        ▼
LLM call: [{ role: "system", content: assembledContext }, ...history]
```

---

## Frontmatter Schema

Each `.md` file follows this structure:

```yaml
---
id: "role-hoyoverse"
title: "HoYoverse Experience"
keywords:
  - hoyoverse
  - mihoyo
  - genshin
  - honkai
  - payment
  - games
  - vue
  - cashier
  - top-up
  - launch
priority: "high"           # high | medium | low — tiebreaker for equal scores
tokens: 450                # approximate token count for budget tracking
content_hash: "a1b2c3d4"  # SHA-256 first 8 chars — for embedding cache invalidation
version: 1                 # increment on content changes — triggers re-embedding
---

## HoYoverse — Senior Frontend Software Engineer (Jul 2022 - Jul 2025)
...markdown content...
```

**Vector-ready fields:**
- `content_hash` — When migrating to Option B, only re-embed files where the hash changed
- `version` — Monotonically increasing; the embedding store can skip files where `version` matches
- `tokens` — Helps the router stay within a token budget (e.g., "max 2,000 tokens of context")

---

## Router Implementation (`server/knowledge/router.ts`)

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import crypto from "crypto";

interface KnowledgeChunk {
  id: string;
  title: string;
  keywords: string[];
  priority: "high" | "medium" | "low";
  tokens: number;
  contentHash: string;
  version: number;
  content: string;  // The markdown body (without frontmatter)
}

let systemPrompt: string = "";
let chunks: KnowledgeChunk[] = [];
let loaded = false;

function loadKnowledge() {
  if (loaded) return;
  const dir = path.join(import.meta.dirname, "knowledge");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);

    if (file === "_system.md") {
      systemPrompt = content.trim();
      continue;
    }

    chunks.push({
      id: data.id || file.replace(".md", ""),
      title: data.title || file,
      keywords: data.keywords || [],
      priority: data.priority || "medium",
      tokens: data.tokens || 500,
      contentHash: data.content_hash || computeHash(content),
      version: data.version || 1,
      content: content.trim(),
    });
  }
  loaded = true;
}

function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
}

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const MAX_CONTEXT_TOKENS = 2500;

export function getRelevantContext(query: string): string {
  loadKnowledge();

  const lowerQuery = query.toLowerCase();

  // Score each chunk by keyword matches + priority
  const scored = chunks.map(chunk => {
    const keywordHits = chunk.keywords.filter(kw => lowerQuery.includes(kw)).length;
    const score = keywordHits * PRIORITY_WEIGHT[chunk.priority];
    return { ...chunk, score };
  });

  // Sort by score descending, then by priority
  const ranked = scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);

  // Select chunks within token budget
  let tokenBudget = MAX_CONTEXT_TOKENS;
  const selected: KnowledgeChunk[] = [];
  for (const chunk of ranked) {
    if (tokenBudget <= 0) break;
    selected.push(chunk);
    tokenBudget -= chunk.tokens;
  }

  // If no chunks matched, include the summary as a fallback
  if (selected.length === 0) {
    const summary = chunks.find(c => c.id === "summary");
    if (summary) selected.push(summary);
  }

  // Assemble: system prompt + selected chunks
  const contextParts = [systemPrompt, ...selected.map(c => c.content)];
  return contextParts.join("\n\n---\n\n");
}

// Export for potential future use (embedding generation, debugging)
export function getAllChunks(): KnowledgeChunk[] {
  loadKnowledge();
  return chunks;
}

export function getSystemPrompt(): string {
  loadKnowledge();
  return systemPrompt;
}
```

---

## Integration Change in `server/routers.ts`

```diff
- import { SYSTEM_PROMPT } from "./knowledge";
+ import { getRelevantContext } from "./knowledge/router";

  // Inside chat.send mutation:
- const chatMessages = [
-   { role: "system" as const, content: SYSTEM_PROMPT },
-   ...input.messages.slice(-10),
- ];
+ const lastUserMessage = input.messages[input.messages.length - 1]?.content || "";
+ const context = getRelevantContext(lastUserMessage);
+ const chatMessages = [
+   { role: "system" as const, content: context },
+   ...input.messages.slice(-5),  // Reduced from 10 to 5 for token savings
+ ];
```

---

## Compliance Checks

- **Structure:** New `server/knowledge/` directory follows the existing pattern of co-locating domain logic (like `server/db.ts`). The router is a pure helper module with no side effects.
- **Architecture:** Single integration point (`routers.ts` line 86). No new API endpoints, no new tRPC procedures. The change is invisible to the frontend.
- **React:** N/A — no frontend changes.
- **i18n:** N/A — all content is English.
- **Security:** Knowledge files are server-side only (not in `client/`). No user input is used in file paths (preventing path traversal). The `content_hash` is computed from content, not user input.

---

## Preflight Risk Checklist

| Category | Status | Notes |
|----------|--------|-------|
| Logic | **Pass** | Keyword matching is deterministic; fallback to `summary.md` prevents empty context |
| Security | **Pass** | No user input in file paths; all files loaded at startup from a fixed directory |
| Architecture | **Pass** | Single integration point; backward-compatible (same LLM call shape) |
| Structure | **Pass** | New directory follows existing server/ patterns |
| React | **N/A** | No frontend changes |
| i18n | **N/A** | English only |
| Responsive UI | **N/A** | No UI changes |
| Reviewability | **Pass** | Each knowledge file is independently readable; router is <100 lines |

**One risk identified and mitigated:**

> **Risk:** If `gray-matter` fails to parse a malformed file, the entire knowledge base could fail to load.
> **Mitigation:** Wrap each file parse in try/catch, log warnings for malformed files, and continue loading others. The system prompt (`_system.md`) is loaded first and separately — if it fails, fall back to a hardcoded minimal prompt.

---

## Verification

| Command / Check | What It Proves |
|----------------|---------------|
| `npx tsc --noEmit` | Zero TypeScript errors after migration |
| `pnpm test` | Existing chat test still passes |
| Ask "What's his experience with AI?" → response mentions Meta/Manus | `role-meta.md` chunk retrieved correctly |
| Ask "What payment systems did he build?" → response mentions HoYoverse | `role-hoyoverse.md` chunk retrieved correctly |
| Ask "What's his email?" → response includes contact info | `contact.md` chunk retrieved correctly |
| Ask a random unrelated question → response still coherent | `summary.md` fallback works |
| Check server logs → "Loaded X knowledge chunks" on startup | File loading works |
| Compare token counts: before (~9,000) vs after (~3,000-4,000) | Token reduction verified |

---

## Execution Order

| Step | Duration | Description |
|------|----------|-------------|
| 1 | 5 min | Install `gray-matter` dependency |
| 2 | 30 min | Create all 20 frontmatter `.md` files by splitting `knowledge.ts` |
| 3 | 20 min | Build `server/knowledge/router.ts` |
| 4 | 10 min | Update `server/routers.ts` to use the new router |
| 5 | 5 min | Delete old `server/knowledge.ts` |
| 6 | 10 min | Test with 5+ queries and verify correct chunk retrieval |
| 7 | 5 min | Checkpoint + push |

**Total: ~85 minutes**

---

## LangGraph Migration Path (Future)

When ready to upgrade to LangGraph, the changes are minimal because of the hybrid-ready structure:

| What Changes | Effort |
|-------------|--------|
| Install `@langchain/langgraph` + `@langchain/openai` | 2 min |
| Add embedding generation script (reads `.md` files, computes embeddings, stores in Supabase pgvector) | 30 min |
| Replace `getRelevantContext()` internals with vector similarity search | 30 min |
| Add a LangGraph `StateGraph` wrapping the retrieve→generate flow | 1 hour |
| Use `content_hash` + `version` to skip re-embedding unchanged files | Already built in |

**Total LangGraph upgrade: ~2 hours on top of this implementation.**

---

## Open Questions

None — all design decisions are deterministic and reversible. The old `knowledge.ts` can be restored from git if needed.
