# LangGraph Agent Upgrade — Implementation Plan

---

## Understanding

Upgrade askJun from a keyword-based retrieval router (Option A) to a full LangGraph agent with vector embeddings and semantic retrieval (Option C). The agent will use a state graph to: classify intent → retrieve relevant knowledge chunks via cosine similarity → generate a response. This enables semantic understanding (synonyms, paraphrases) and opens the door to multi-tool agent behavior in the future.

**Non-goals:**
- No changes to the frontend UI or chat UX (same tRPC endpoint, same response format)
- No external vector database (use in-memory vector store for 20 chunks — fast, zero infrastructure)
- No conversation memory persistence in this phase (future enhancement)
- No additional tools beyond retrieval (web search, calendar, etc. are future work)

---

## Relevant Code

| File | Why It Matters |
|------|---------------|
| `server/knowledge/router.ts` | Current keyword router — will be replaced with LangGraph agent |
| `server/knowledge/*.md` | 20 frontmatter files — unchanged, loaded by the new agent |
| `server/routers.ts` (line 86) | Consumer — calls `getRelevantContext(query)` — interface stays the same |
| `server/_core/env.ts` | LLM API keys — reused by LangGraph's ChatOpenAI |
| `package.json` | New dependencies: `@langchain/langgraph`, `@langchain/openai`, `@langchain/core` |

---

## Architecture: LangGraph State Graph

```
                    ┌─────────────────────┐
                    │   START             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   classifyIntent    │
                    │   (LLM decides what │
                    │    info is needed)  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   retrieveContext   │
                    │   (Vector similarity│
                    │    search on chunks)│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   generateResponse  │
                    │   (LLM with system  │
                    │    prompt + context)│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   END              │
                    └─────────────────────┘
```

**State schema:**
```typescript
interface AgentState {
  query: string;                    // The user's latest message
  conversationHistory: Message[];   // Last 5 messages for context
  intent: string;                   // Classified intent (experience, projects, contact, etc.)
  retrievedChunks: string[];        // Relevant knowledge chunks
  response: string;                 // Final generated response
}
```

---

## Proposed Approach

### Phase 1: Install Dependencies (5 min)

```bash
pnpm add @langchain/langgraph @langchain/openai @langchain/core
```

**Package purposes:**
- `@langchain/langgraph` — State graph orchestration (StateGraph, START, END, nodes, edges)
- `@langchain/openai` — ChatOpenAI model + OpenAIEmbeddings for vector search
- `@langchain/core` — Base types (Messages, Documents, VectorStore)

### Phase 2: Build In-Memory Vector Store (30 min)

Create `server/knowledge/vectorStore.ts`:

**Strategy:** Since we only have 20 chunks (~4,000 total tokens), we'll use an **in-memory vector store** — no external database needed. Embeddings are computed once at server start and cached.

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

// Load all knowledge chunks as Documents
// Compute embeddings once at startup
// Expose a similarity search function
```

**Embedding model:** `text-embedding-3-small` ($0.02/1M tokens) — for 20 chunks at ~500 tokens each, the one-time embedding cost is ~$0.0002 (essentially free). Re-embeds only when `content_hash` changes.

**Embedding cache:** Store computed embeddings in a local JSON file (`server/knowledge/.embeddings-cache.json`). On startup, compare `content_hash` of each chunk against the cache — only re-embed changed files. This means zero API calls on most server restarts.

### Phase 3: Build the LangGraph Agent (45 min)

Create `server/knowledge/agent.ts`:

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { Annotation } from "@langchain/langgraph";

// Define state schema
const AgentState = Annotation.Root({
  query: Annotation<string>,
  history: Annotation<Array<{ role: string; content: string }>>,
  retrievedContext: Annotation<string>,
  response: Annotation<string>,
});

// Node 1: Retrieve relevant chunks via vector similarity
async function retrieveContext(state: typeof AgentState.State) {
  const results = await vectorStore.similaritySearch(state.query, 3);
  const context = results.map(doc => doc.pageContent).join("\n\n---\n\n");
  return { retrievedContext: context };
}

// Node 2: Generate response using LLM with retrieved context
async function generateResponse(state: typeof AgentState.State) {
  const systemMessage = `${systemPrompt}\n\n---\n\n${state.retrievedContext}`;
  const response = await llm.invoke([
    { role: "system", content: systemMessage },
    ...state.history,
    { role: "user", content: state.query },
  ]);
  return { response: response.content };
}

// Build the graph
const graph = new StateGraph(AgentState)
  .addNode("retrieve", retrieveContext)
  .addNode("generate", generateResponse)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END)
  .compile();
```

**Why no `classifyIntent` node in v1:** For 20 chunks, vector similarity search is already fast enough (~5ms) and accurate enough that a separate classification step adds latency without meaningful accuracy gain. The classification node becomes valuable when you have 100+ chunks or need to route to different tools (web search, calendar, etc.).

### Phase 4: Replace the Router Interface (15 min)

Update `server/knowledge/router.ts` to use the LangGraph agent internally while keeping the same exported `getRelevantContext()` interface. This means **zero changes to `server/routers.ts`** — backward compatible.

```typescript
// Option A: Keep getRelevantContext() as the interface (backward compatible)
export async function getRelevantContext(query: string): Promise<string> {
  const results = await vectorStore.similaritySearch(query, 3);
  const chunks = results.map(doc => doc.pageContent).join("\n\n---\n\n");
  return [systemPrompt, "---", chunks, contactChunk].join("\n\n");
}

// Option B: Expose the full agent for richer responses (future)
export async function runAgent(query: string, history: Message[]): Promise<string> {
  const result = await graph.invoke({ query, history, retrievedContext: "", response: "" });
  return result.response;
}
```

**Recommendation:** Start with Option A (drop-in replacement) then migrate to Option B when you want the agent to handle the full LLM call internally (removing the raw fetch from `routers.ts`).

### Phase 5: Update routers.ts (10 min)

Since `getRelevantContext` becomes async (embedding search is async), update the chat.send mutation:

```diff
- const context = getRelevantContext(lastUserMessage);
+ const context = await getRelevantContext(lastUserMessage);
```

### Phase 6: Embedding Cache + Startup Optimization (15 min)

Create `server/knowledge/.embeddings-cache.json`:

```json
{
  "model": "text-embedding-3-small",
  "chunks": {
    "role-meta": { "hash": "c3d4e5f6", "version": 1, "embedding": [0.012, -0.034, ...] },
    "role-hoyoverse": { "hash": "e5f6a7b8", "version": 1, "embedding": [...] }
  }
}
```

On startup:
1. Load all `.md` files
2. Load cache file
3. For each chunk: if `content_hash` matches cache → use cached embedding
4. For changed/new chunks: compute embedding via API, update cache
5. Save updated cache to disk

**Result:** Server restarts are instant (no API calls) unless knowledge files change.

### Phase 7: Testing & Verification (15 min)

Write a vitest test for the vector store:
```typescript
describe("knowledge/vectorStore", () => {
  it("returns relevant chunks for a payment query", async () => {
    const results = await search("payment systems");
    expect(results.some(r => r.id === "role-hoyoverse")).toBe(true);
  });

  it("returns relevant chunks for an AI query", async () => {
    const results = await search("AI agent experience");
    expect(results.some(r => r.id === "role-meta")).toBe(true);
  });

  it("falls back to summary for unrelated queries", async () => {
    const context = await getRelevantContext("random gibberish xyz");
    expect(context).toContain("Professional Summary");
  });
});
```

---

## File-Level Plan

### New Files

| File | Purpose |
|------|---------|
| `server/knowledge/vectorStore.ts` | In-memory vector store with embedding cache |
| `server/knowledge/agent.ts` | LangGraph StateGraph (future full-agent mode) |
| `server/knowledge/.embeddings-cache.json` | Cached embeddings (auto-generated, gitignored) |

### Modified Files

| File | Change |
|------|--------|
| `server/knowledge/router.ts` | Replace keyword scoring with vector similarity search |
| `server/routers.ts` | Add `await` to `getRelevantContext()` call (now async) |
| `package.json` | Add `@langchain/langgraph`, `@langchain/openai`, `@langchain/core` |
| `.gitignore` | Add `server/knowledge/.embeddings-cache.json` |

### Unchanged Files

| File | Why Unchanged |
|------|--------------|
| `server/knowledge/*.md` (all 20 files) | Same frontmatter format, same content |
| `client/src/**` | Zero frontend changes |
| `server/_core/env.ts` | Same `LLM_API_KEY` used by both LangGraph and raw fetch |

---

## Data Flow (Post-Upgrade)

```
User sends "Tell me about his payment work"
        │
        ▼
server/routers.ts → chat.send mutation
        │
        ├── Extract last user message
        │
        ▼
server/knowledge/router.ts → getRelevantContext(query)  [NOW ASYNC]
        │
        ├── 1. Embed the query using text-embedding-3-small
        ├── 2. Cosine similarity search against 20 pre-embedded chunks
        ├── 3. Return top 3 chunks: role-hoyoverse, company-hoyoverse, summary
        ├── 4. Concatenate: system prompt + matched chunks + contact
        │
        ▼
Assembled context string (~2,000-3,000 tokens)
        │
        ▼
LLM call: [{ role: "system", content: assembledContext }, ...history]
```

**vs. Current (keyword-based):**
- Current: "payment" matches keyword → returns role-hoyoverse ✓
- New: "cashier systems" (no exact keyword match) → embedding similarity → returns role-hoyoverse ✓
- New: "how did he handle money at the game company" → embedding similarity → returns role-hoyoverse ✓

---

## Compliance Checks

- **Structure:** New files follow existing `server/knowledge/` pattern. Agent is a helper module, not a new API endpoint.
- **Architecture:** Same interface (`getRelevantContext`) — backward compatible. The LangGraph graph is internal implementation detail.
- **React:** N/A — zero frontend changes.
- **Security:** Embeddings are computed server-side only. No user input in file paths. API key reused from existing ENV.
- **Performance:** In-memory vector store means ~5ms retrieval (vs ~1ms for keyword). Embedding cache eliminates startup API calls.

---

## Preflight Risk Checklist

| Category | Status | Notes |
|----------|--------|-------|
| Logic | **Pass** | Vector similarity is more accurate than keyword matching; fallback to summary maintained |
| Security | **Pass** | Same API key, same server-side execution, no new attack surface |
| Architecture | **Pass** | Drop-in replacement via same exported function signature |
| Structure | **Pass** | New files in existing directory |
| React | **N/A** | No frontend changes |
| Performance | **Low risk** | First startup requires embedding API call (~2s for 20 chunks). Subsequent starts use cache (0ms). |
| Cost | **Low risk** | One-time embedding: $0.0002. Per-query embedding: $0.000002. Negligible. |

**One risk identified and mitigated:**

> **Risk:** If the OpenAI API is unreachable during first startup (no cache), the vector store won't initialize.
> **Mitigation:** Fall back to the existing keyword-based scoring if embeddings fail. The keyword router code remains as a fallback path.

---

## Verification

| Command / Check | What It Proves |
|----------------|---------------|
| `npx tsc --noEmit` | Zero TypeScript errors |
| `pnpm test` | All existing + new tests pass |
| Ask "payment systems" → mentions HoYoverse | Semantic retrieval works |
| Ask "how did he handle money at the game company" → mentions HoYoverse | Paraphrase understanding works (keyword router would MISS this) |
| Ask "What's his email?" → returns contact info | Contact always-include logic works |
| Check `.embeddings-cache.json` exists after first run | Cache generation works |
| Restart server → no embedding API calls in logs | Cache reuse works |
| `wc -c .embeddings-cache.json` → ~50KB | Reasonable cache size for 20 chunks |

---

## Execution Order

| Step | Duration | Description |
|------|----------|-------------|
| 1 | 5 min | Install `@langchain/langgraph`, `@langchain/openai`, `@langchain/core` |
| 2 | 30 min | Build `vectorStore.ts` with embedding cache and similarity search |
| 3 | 15 min | Rewrite `router.ts` to use vector similarity (keep keyword as fallback) |
| 4 | 10 min | Update `routers.ts` to await the now-async `getRelevantContext()` |
| 5 | 15 min | Build `agent.ts` (LangGraph StateGraph — future full-agent mode) |
| 6 | 15 min | Write vitest tests for vector retrieval accuracy |
| 7 | 5 min | Add `.embeddings-cache.json` to `.gitignore` |
| 8 | 10 min | Test end-to-end, verify paraphrase queries work |
| 9 | 5 min | Checkpoint + push |

**Total: ~110 minutes**

---

## Future Extensions (Enabled by LangGraph)

Once the StateGraph is in place, adding new capabilities is trivial:

| Extension | Effort | What It Adds |
|-----------|--------|-------------|
| **Web search tool** | 30 min | Agent can search the web for questions outside the knowledge base |
| **GitHub tool** | 30 min | Agent can fetch latest commit info, repo stats from Jun's GitHub |
| **Calendar/booking tool** | 1 hour | Agent can check availability and suggest meeting times |
| **Multi-step reasoning** | 30 min | Agent decides if it needs more info before answering |
| **Conversation memory** | 30 min | Agent remembers context across sessions (stored in DB) |
| **Adaptive retrieval** | 15 min | Agent decides how many chunks to retrieve based on query complexity |

Each extension is just a new node + edge in the graph. The architecture scales without rewrites.

---

## Open Questions

1. **Do you want the full agent mode (Option B) immediately?** This would move the LLM call inside the LangGraph graph, removing the raw fetch from `routers.ts`. Cleaner architecture but slightly more complex to debug.
2. **Should we keep the keyword router as a permanent fallback?** Recommended for resilience — if embeddings fail, keyword matching still works.
3. **Do you want to add the `classifyIntent` node?** Not needed for 20 chunks, but useful if you plan to add tools (web search, GitHub, etc.) soon.
