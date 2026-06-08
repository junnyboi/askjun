# askJun RAG Migration Proposal

**From:** Monolithic system prompt (8K tokens, every call)
**To:** Retrieval-augmented agent with modular knowledge chunks

---

## Problem Statement

The current architecture stuffs the entire knowledge base (~8,000 tokens) into every single LLM call. This means:

| Issue | Impact |
|-------|--------|
| **Token waste** | Every question — even "What's his email?" — sends 8K tokens of context |
| **Cost** | ~$0.003/call just for the system prompt input tokens (GPT-4.1-mini at $0.40/1M) |
| **Scalability** | Adding more content (new projects, testimonials, blog posts) will hit context limits |
| **Latency** | Larger prompts = slower first-token response time |
| **Relevance dilution** | The LLM has to "find" the relevant 200 tokens among 8,000 — accuracy degrades |

For a portfolio with ~50 conversations/day, this costs ~$4.50/month in wasted input tokens. Not catastrophic, but architecturally inelegant — and it won't scale if we add blog posts, project deep-dives, or recommendation letters.

---

## Proposed Architecture: Hybrid RAG Agent

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│  ROUTER (Intent Classification)      │
│  "What topic is this about?"         │
│  → experience | projects | skills    │
│  → company | education | contact     │
│  → meta | easter_egg | unknown       │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  RETRIEVER (Fetch relevant chunks)   │
│  Option A: Keyword-based routing     │
│  Option B: Vector similarity search  │
│  Option C: Hybrid (keyword + vector) │
└───────────────┬─────────────────────┘
                │ 1-3 relevant chunks (~500-1500 tokens)
                ▼
┌─────────────────────────────────────┐
│  LLM (GPT-4.1-mini)                 │
│  System: personality + rules (~800t) │
│  Context: retrieved chunks (~1500t)  │
│  History: last 5 messages (~500t)    │
│  Total: ~2,800 tokens (vs 8,000)    │
└─────────────────────────────────────┘
```

**Token reduction: ~65% per call** (8,000 → 2,800 average)

---

## Knowledge Base Restructure: Frontmatter Files

Break the monolithic `knowledge.ts` into individual markdown files with YAML frontmatter:

```
server/knowledge/
├── _system.md          # Personality + rules (always included, ~800 tokens)
├── meta-summary.md     # Professional summary (included for "who is Jun?" queries)
├── role-meta.md        # Current role at Meta/Manus
├── role-instawork.md   # Instawork experience
├── role-hoyoverse.md   # HoYoverse experience
├── role-tiktok.md      # TikTok/ByteDance experience
├── role-bos.md         # Bank of Singapore experience
├── role-dbs.md         # DBS Bank experience
├── skills.md           # Technical skills
├── education.md        # Education + certifications
├── awards.md           # Awards & recognition
├── projects-games.md   # Game dev portfolio (8 games)
├── projects-apps.md    # Trident, Swipe, Mijun, Housewarmer
├── company-meta.md     # Meta/Manus company context
├── company-hoyoverse.md # HoYoverse company context
├── company-tiktok.md   # TikTok/ByteDance company context
├── company-bos.md      # Bank of Singapore company context
├── why-hire.md         # The 30-second pitch
├── personal.md         # Background, personality, interests
├── contact.md          # All contact info
└── easter-eggs.md      # Appearance, fun facts
```

**Each file has frontmatter:**
```yaml
---
id: role-hoyoverse
title: HoYoverse Experience
keywords: [hoyoverse, mihoyo, genshin, honkai, payment, games, vue]
priority: high
tokens: ~450
---

## HoYoverse — Senior Frontend Software Engineer (Jul 2022 - Jul 2025)
...content...
```

---

## Three Implementation Options

### Option A: Keyword-Based Routing (Simplest, 2 hours)

**How it works:** Match the user's query against each file's `keywords` array. Return the top 2-3 matching files as context.

**Pros:**
- Zero dependencies (no vector DB, no embedding model)
- Deterministic — same query always returns same chunks
- Fast — O(n) string matching, no API calls for retrieval
- Easy to debug ("why did it include this chunk?")

**Cons:**
- Brittle — "Tell me about his game work" won't match if keywords only have "game dev"
- No semantic understanding — synonyms and paraphrases miss

**Implementation:**
```typescript
// server/knowledge/router.ts
function getRelevantChunks(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return knowledgeFiles
    .map(file => ({
      ...file,
      score: file.keywords.filter(kw => lowerQuery.includes(kw)).length
    }))
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(f => f.content);
}
```

---

### Option B: Vector Embeddings + Similarity Search (Most Powerful, 4-6 hours)

**How it works:** Embed all knowledge chunks into vectors at build time. At query time, embed the user's question and find the most similar chunks via cosine similarity.

**Pros:**
- Semantic understanding — "payment work" matches "cashier" and "top-up"
- Handles paraphrases, synonyms, and indirect references
- Scales to hundreds of documents without degradation

**Cons:**
- Requires an embedding model (OpenAI `text-embedding-3-small` — $0.02/1M tokens)
- Needs a vector store (Supabase pgvector, Pinecone, or in-memory)
- More complex to debug
- Cold start: first query needs embedding computation

**Implementation with Supabase pgvector:**
```typescript
// Pre-compute embeddings at build time or server start
const embeddings = await Promise.all(
  chunks.map(chunk => openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunk.content,
  }))
);

// At query time
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: userQuery,
});

// Cosine similarity search in Supabase
const { data } = await supabase.rpc('match_documents', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,
  match_count: 3,
});
```

---

### Option C: LangGraph Agent with Tool Use (Most Sophisticated, 8-12 hours)

**How it works:** Use LangGraph.js to build a stateful agent graph with nodes for: intent classification → retrieval → response generation → follow-up suggestion. The agent can "decide" which tools to call (retrieve_experience, retrieve_projects, retrieve_company_info) based on the query.

**Pros:**
- True agent behavior — can reason about what info to retrieve
- Supports multi-step retrieval ("Tell me about his payments work AND the company context")
- Built-in memory management and conversation state
- Can be extended with new tools (web search, calendar booking, etc.)
- Industry-standard framework (LangChain ecosystem)

**Cons:**
- Heaviest implementation — new dependency tree (langchain, langgraph)
- Overkill for a portfolio site with 20 knowledge chunks
- More latency (agent reasoning step before retrieval)
- Harder to debug graph execution

**Implementation:**
```typescript
import { StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const graph = new StateGraph({ channels: { messages, context, intent } })
  .addNode("classify", classifyIntent)
  .addNode("retrieve", retrieveRelevantChunks)
  .addNode("generate", generateResponse)
  .addEdge("classify", "retrieve")
  .addEdge("retrieve", "generate")
  .compile();
```

---

## My Recommendation: Option A First, Option B Later

**For askJun's current scale (20 knowledge chunks, ~50 chats/day), Option A is the right choice:**

| Factor | Option A | Option B | Option C |
|--------|----------|----------|----------|
| Implementation time | 2 hours | 4-6 hours | 8-12 hours |
| Dependencies | Zero | OpenAI embeddings + pgvector | LangGraph + LangChain + embeddings |
| Token savings | ~50% | ~65% | ~65% |
| Accuracy | Good (90%) | Excellent (98%) | Excellent (98%) |
| Debuggability | Trivial | Moderate | Complex |
| Scalability ceiling | ~50 chunks | ~10,000 chunks | Unlimited |
| Monthly cost added | $0 | ~$0.10 (embeddings) | ~$0.10 + compute |

**The migration path:**
1. **Now:** Implement Option A (keyword routing with frontmatter files)
2. **When needed:** Upgrade to Option B (add pgvector to Supabase) if the knowledge base grows beyond 50 chunks or accuracy drops
3. **Future:** Consider Option C (LangGraph) only if you want multi-tool agent behavior (e.g., the agent can also search your GitHub repos, check your calendar, or send emails)

---

## Implementation Plan for Option A

### Phase 1: Restructure Knowledge Files (30 min)

Split `server/knowledge.ts` into 20 markdown files in `server/knowledge/` directory. Each file has YAML frontmatter with `id`, `keywords`, `priority`, and `tokens` metadata.

### Phase 2: Build the Router (45 min)

Create `server/knowledge/router.ts`:
- Load all `.md` files at server start
- Parse frontmatter with `gray-matter` package
- Implement keyword matching with TF-IDF-like scoring
- Always include `_system.md` (personality + rules)
- Return top 2-3 relevant chunks + system prompt

### Phase 3: Update the Chat Endpoint (30 min)

Modify `server/routers.ts` `chat.send`:
- Replace static `SYSTEM_PROMPT` with dynamic `getRelevantContext(query)`
- Reduce conversation history from 10 messages to 5 (saves tokens)
- Add a `context_chunks` field to the response for debugging

### Phase 4: Verify & Benchmark (15 min)

- Test 10 common queries and verify correct chunks are retrieved
- Measure token reduction (target: 50%+ reduction)
- Verify no regression in response quality

---

## Future: LangGraph Upgrade Path

If you decide to go full LangGraph later, here's the architecture:

```
┌─────────────────────────────────────────────────┐
│  LangGraph State Machine                         │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Classify │───▶│ Retrieve │───▶│ Generate │  │
│  │  Intent  │    │  Context │    │ Response │  │
│  └──────────┘    └──────────┘    └──────────┘  │
│       │                │                │       │
│       │                ▼                │       │
│       │         ┌──────────┐            │       │
│       │         │  Tools   │            │       │
│       │         │ - search │            │       │
│       │         │ - resume │            │       │
│       │         │ - contact│            │       │
│       │         └──────────┘            │       │
│       │                                 │       │
│       └─────── Conditional Edge ────────┘       │
│         (if unknown → ask for clarification)    │
└─────────────────────────────────────────────────┘
```

**LangGraph.js dependencies:**
```json
{
  "@langchain/core": "^0.3.x",
  "@langchain/openai": "^0.3.x",
  "@langchain/langgraph": "^0.2.x"
}
```

This would give askJun true agent capabilities: reasoning about what to retrieve, handling multi-step queries, and potentially integrating external tools (GitHub API, calendar, etc.).

---

## Cost Comparison

| Architecture | Tokens/Call | Cost/Call | Monthly (50/day) |
|-------------|------------|-----------|-----------------|
| Current (full prompt) | ~9,000 | $0.005 | $7.50 |
| Option A (keyword RAG) | ~3,500 | $0.002 | $3.00 |
| Option B (vector RAG) | ~3,000 | $0.002 + embed | $3.10 |
| Option C (LangGraph) | ~3,500 | $0.003 (2 calls) | $4.50 |

**Savings with Option A: ~60% token reduction, ~$4.50/month saved.**

---

## Open Questions

1. **Do you want to proceed with Option A now?** It's the fastest path to token savings with zero new dependencies.
2. **Do you already have Supabase pgvector enabled?** If yes, Option B becomes trivial since we already have the dual-DB fallback in place.
3. **Is multi-tool agent behavior a goal?** If you want askJun to eventually do things like "check my GitHub for the latest commit" or "schedule a meeting," then LangGraph is the right long-term investment.
