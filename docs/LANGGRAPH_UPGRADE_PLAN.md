# LangGraph Hybrid Agent Upgrade — Implementation Plan (v2)

---

## Understanding

Upgrade askJun from a pure keyword-based retrieval router to a **hybrid routing agent** powered by LangGraph. The agent uses a two-tier retrieval strategy:

1. **Keyword Router (Deterministic)** — Captures explicit, unambiguous queries ("email", "resume", "GitHub", "phone") and returns structured data from a JSON lookup table instantly. Zero LLM calls, zero vector search, 100% accuracy.

2. **Semantic Retrieval Engine (Vector)** — Handles ambiguous, conversational queries ("How does he approach scaling microservices?", "Tell me about his experience with real-time systems") by embedding the query and finding the most conceptually similar knowledge chunks.

This mirrors production RAG pipelines at companies like Anthropic, Perplexity, and Notion — never rely on a single retrieval mechanism.

**Non-goals:**
- No changes to the frontend UI or chat UX (same tRPC endpoint, same response format)
- No external vector database (in-memory for 20 chunks)
- No conversation memory persistence (future enhancement)
- No additional agent tools beyond retrieval (future enhancement)

---

## Why Hybrid > Pure Vector

| Query | Pure Vector Result | Hybrid Result |
|-------|-------------------|---------------|
| "What's his email?" | Might return a blog post mentioning email | **Instant JSON lookup** → `boh.ze.jun@gmail.com` |
| "Show me his resume" | Might return a chunk about career summary | **Keyword match** → CV download link |
| "GitHub link" | Might return a project description | **Keyword match** → `github.com/junnyboi` |
| "How did he handle money at the game company?" | ✓ Correct (semantic match) | ✓ Correct (semantic match) |
| "What's his approach to building AI agents?" | ✓ Correct (semantic match) | ✓ Correct (semantic match) |

**Rule of thumb:** If the answer is a fact (URL, email, phone, name), use deterministic lookup. If the answer requires synthesis from multiple data points, use semantic retrieval.

---

## Architecture: Hybrid Routing Agent

```
User Query: "What's his GitHub?"
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 1: KEYWORD ROUTER (Deterministic)                  │
│                                                          │
│  Check query against hardcoded tool map:                 │
│  "github" → { type: "structured", data: CONTACT.github } │
│  "email"  → { type: "structured", data: CONTACT.email }  │
│  "resume" → { type: "structured", data: CONTACT.cv }     │
│  "phone"  → { type: "structured", data: CONTACT.phone }  │
│                                                          │
│  Match found? → Return structured response immediately   │
│  No match?   → Pass to Step 2                            │
└──────────────────────────┬──────────────────────────────┘
                           │ (no keyword match)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: SEMANTIC RETRIEVAL (Vector Similarity)          │
│                                                          │
│  Embed the query using text-embedding-3-small            │
│  Cosine similarity against 20 pre-embedded chunks        │
│  Return top 3 chunks (within 2,500 token budget)         │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: LLM GENERATION                                  │
│                                                          │
│  System prompt (_system.md) + retrieved chunks + history  │
│  → GPT-4.1-mini generates the final response             │
└─────────────────────────────────────────────────────────┘
```

---

## Data Architecture: Two-Tier Knowledge Store

### Tier 1: Structured Data (JSON Lookup Table)

Deterministic, instant, zero-cost retrieval for factual queries.

```typescript
// server/knowledge/structured.ts
export const STRUCTURED_DATA = {
  contact: {
    email: "boh.ze.jun@gmail.com",
    linkedin: "https://linkedin.com/in/junboh",
    github: "https://github.com/junnyboi",
    phone: "+65 8233 5937",
    whatsapp: "https://wa.me/6582335937",
    location: "Singapore",
  },
  resume: {
    downloadUrl: "/assets/JunBoh-CV-2026.pdf",
    filename: "JunBoh_CV_2026.pdf",
  },
  techStack: {
    languages: ["JavaScript", "TypeScript", "Python", "Golang", "Java", "SQL", "C#"],
    frameworks: ["React", "Vue.js", "Node.js", "Django", "Spring Boot", "Tailwind", "Next.js"],
    tools: ["Git", "Docker", "CI/CD", "Webpack/Vite", "Kafka", "Shell"],
    domains: ["AI Agent Interfaces", "Payment Systems", "High-Traffic Architecture", "GDPR"],
  },
  currentRole: {
    company: "Meta (Manus AI)",
    title: "Senior Frontend Software Engineer",
    since: "Feb 2026",
    location: "Singapore",
  },
  metrics: {
    experience: "7+ years",
    processed: "$57M launch week",
    signups: "15M in 48h",
    dau: "8M daily users",
    savings: "$1.5M/annum",
    countries: "100+",
    paymentMethods: "50+",
  },
};
```

### Tier 2: Vector Documents (Embedded Markdown Chunks)

Semantic, contextual retrieval for conversational queries.

```
server/knowledge/*.md (existing 20 files)
├── role-meta.md          → embedded as vector
├── role-hoyoverse.md     → embedded as vector
├── projects-games.md     → embedded as vector
├── why-hire.md           → embedded as vector
└── ... (all 20 files)
```

---

## LangGraph State Graph (Updated)

```typescript
const AgentState = Annotation.Root({
  query: Annotation<string>,
  history: Annotation<Array<{ role: string; content: string }>>,
  routeType: Annotation<"structured" | "semantic">,  // NEW: routing decision
  structuredResponse: Annotation<string | null>,       // NEW: instant lookup result
  retrievedContext: Annotation<string>,
  response: Annotation<string>,
});

// Graph topology:
//
//   START → route → [structured] → formatStructured → END
//                 → [semantic]   → retrieve → generate → END

const graph = new StateGraph(AgentState)
  .addNode("route", keywordRoute)           // Deterministic keyword check
  .addNode("formatStructured", formatLookup) // Format structured data as natural language
  .addNode("retrieve", vectorRetrieve)       // Embed query + similarity search
  .addNode("generate", llmGenerate)          // LLM with context
  .addEdge(START, "route")
  .addConditionalEdges("route", (state) => {
    return state.routeType === "structured" ? "formatStructured" : "retrieve";
  })
  .addEdge("formatStructured", END)
  .addEdge("retrieve", "generate")
  .addEdge("generate", END)
  .compile();
```

---

## Keyword Router: Tool Map

```typescript
// server/knowledge/keywordRouter.ts

interface ToolMatch {
  type: "structured";
  category: string;
  response: string;  // Pre-formatted markdown response
}

const TOOL_MAP: Array<{ keywords: string[]; match: ToolMatch }> = [
  {
    keywords: ["email", "mail", "reach out", "contact him"],
    match: {
      type: "structured",
      category: "contact",
      response: "You can reach Jun at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com) or connect on [LinkedIn](https://linkedin.com/in/junboh). He's also available on WhatsApp at [+65 8233 5937](https://wa.me/6582335937).",
    },
  },
  {
    keywords: ["github", "repo", "source code", "open source"],
    match: {
      type: "structured",
      category: "github",
      response: "Jun's GitHub is [github.com/junnyboi](https://github.com/junnyboi). Notable public repos include [askJun](https://github.com/junnyboi/askjun) (this AI portfolio) and [Swipe](https://github.com/junnyboi/swipe) (image pinboard app).",
    },
  },
  {
    keywords: ["resume", "cv", "download cv", "pdf"],
    match: {
      type: "structured",
      category: "resume",
      response: "You can download Jun's CV directly from the **Download CV** button in the header, or [click here](/assets/JunBoh-CV-2026.pdf) to download the PDF.",
    },
  },
  {
    keywords: ["phone", "call", "whatsapp", "number"],
    match: {
      type: "structured",
      category: "phone",
      response: "Jun's phone number is **+65 8233 5937**. You can also reach him on [WhatsApp](https://wa.me/6582335937) for a quick chat.",
    },
  },
  {
    keywords: ["linkedin", "connect"],
    match: {
      type: "structured",
      category: "linkedin",
      response: "Jun's LinkedIn is [linkedin.com/in/junboh](https://linkedin.com/in/junboh) — he has 5,392 followers and is active in the Singapore tech community.",
    },
  },
  {
    keywords: ["location", "where", "based", "country", "city"],
    match: {
      type: "structured",
      category: "location",
      response: "Jun is based in **Singapore**. He's open to Singapore-based roles and compelling remote opportunities.",
    },
  },
  {
    keywords: ["tech stack", "technologies", "what languages", "what tools"],
    match: {
      type: "structured",
      category: "techstack",
      response: "**Languages:** JavaScript, TypeScript, Python, Golang, Java, SQL, C#\n**Frameworks:** React, Vue.js, Node.js, Django, Spring Boot, Tailwind, Next.js, Framer Motion\n**Tools:** Git, Docker, CI/CD, Webpack/Vite, Kafka\n**Domains:** AI Agent Interfaces, Payment Systems (50+ methods, 100+ countries), High-Traffic Architecture (8M DAU), GDPR Compliance",
    },
  },
];

export function keywordRoute(query: string): ToolMatch | null {
  const lower = query.toLowerCase();
  for (const { keywords, match } of TOOL_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return match;
    }
  }
  return null; // No deterministic match → fall through to semantic
}
```

---

## Execution Order (Updated)

| Step | Duration | Description |
|------|----------|-------------|
| 1 | 5 min | Install `@langchain/langgraph`, `@langchain/openai`, `@langchain/core` |
| 2 | 20 min | Create `server/knowledge/structured.ts` — JSON lookup table + keyword tool map |
| 3 | 20 min | Create `server/knowledge/keywordRouter.ts` — deterministic routing logic |
| 4 | 30 min | Create `server/knowledge/vectorStore.ts` — in-memory embeddings + cache |
| 5 | 30 min | Create `server/knowledge/agent.ts` — LangGraph StateGraph with conditional routing |
| 6 | 15 min | Rewrite `server/knowledge/router.ts` — new `getRelevantContext()` using hybrid agent |
| 7 | 10 min | Update `server/routers.ts` — add `await` to the now-async call |
| 8 | 15 min | Write vitest tests for both routing paths |
| 9 | 10 min | Add `.embeddings-cache.json` to `.gitignore`, test end-to-end |
| 10 | 5 min | Checkpoint + push |

**Total: ~160 minutes** (up from 110 min due to the hybrid routing layer)

---

## Embedding Cache Strategy

```
server/knowledge/.embeddings-cache.json (gitignored)
{
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "generated_at": "2026-06-08T10:00:00Z",
  "chunks": {
    "role-meta": {
      "content_hash": "c3d4e5f6",
      "version": 1,
      "embedding": [0.012, -0.034, 0.056, ...]  // 1536 floats
    },
    ...
  }
}
```

**Cache invalidation rules:**
1. If `content_hash` in `.md` file ≠ `content_hash` in cache → re-embed that chunk
2. If `.md` file is new (no cache entry) → embed and add to cache
3. If cache file doesn't exist → embed all chunks (first run only)
4. If `model` in cache ≠ current model → re-embed all (model upgrade)

---

## Cost Analysis (Hybrid vs Pure Vector)

| Operation | Pure Vector | Hybrid |
|-----------|------------|--------|
| "What's his email?" | Embed query ($0.000002) + similarity search | **$0 — instant JSON lookup** |
| "Tell me about payments" | Embed query + similarity search | Embed query + similarity search |
| Average per query | $0.000002 | **$0.000001** (50% queries are deterministic) |
| Monthly (50/day) | $0.003 | **$0.0015** |

The cost difference is negligible, but the **latency** difference is significant:
- Deterministic: **0ms** (no API call, no computation)
- Semantic: **~200ms** (embedding API call + cosine similarity)

For "What's his email?" — the recruiter gets an answer in 0ms instead of 200ms. That's the difference between feeling instant and feeling like it's "thinking."

---

## Preflight Risk Checklist

| Category | Status | Notes |
|----------|--------|-------|
| Logic | **Pass** | Keyword router handles deterministic queries; vector handles semantic; fallback to summary if both miss |
| Security | **Pass** | Same API key, server-side only, no user input in file paths |
| Architecture | **Pass** | Same exported interface; conditional routing is internal |
| Performance | **Pass** | Deterministic queries are faster (0ms vs 200ms); semantic queries same as before |
| Cost | **Pass** | Negligible embedding cost; deterministic queries are free |
| Resilience | **Pass** | If embedding API fails → fall back to keyword-only router (existing behavior) |

---

## Open Questions

1. **Should the keyword router also handle the "handsome" Easter egg?** (Probably yes — it's a deterministic response, not a semantic one)
2. **Should we add a "confidence threshold" to the keyword router?** (e.g., require 2+ keyword matches before claiming a deterministic match, to avoid false positives)
3. **Do you want structured responses to still go through the LLM for natural language formatting?** (Current plan: pre-formatted markdown returned directly. Alternative: pass structured data to LLM for a more conversational tone.)
