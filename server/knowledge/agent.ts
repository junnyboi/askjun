/**
 * LangGraph Hybrid Agent — Conditional routing between:
 * 1. Keyword Router (deterministic, instant) for explicit queries
 * 2. Semantic Retrieval (vector similarity) for conversational queries
 *
 * Graph topology:
 *   START → route → [keyword match]  → END (return structured response)
 *                 → [no match]       → retrieve → END (return context for LLM)
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { keywordRoute, type StructuredMatch } from "./keywordRouter";
import { similaritySearch, getSystemPrompt, initVectorStore } from "./vectorStore";

// State schema for the agent graph
const AgentState = Annotation.Root({
  query: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  routeType: Annotation<"structured" | "semantic">({ reducer: (_, b) => b, default: () => "semantic" }),
  structuredResponse: Annotation<string | null>({ reducer: (_, b) => b, default: () => null }),
  retrievedContext: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
});

// Node 1: Route — check keyword router first
function routeNode(state: typeof AgentState.State) {
  const match: StructuredMatch | null = keywordRoute(state.query);
  if (match) {
    return {
      routeType: "structured" as const,
      structuredResponse: match.response,
    };
  }
  return {
    routeType: "semantic" as const,
    structuredResponse: null,
  };
}

// Node 2: Retrieve — vector similarity search for semantic queries
// Falls back to returning empty string if vector store has no embeddings,
// which signals router.ts to use the keyword-based fallback instead.
async function retrieveNode(state: typeof AgentState.State) {
  const results = await similaritySearch(state.query, 3);
  const systemPrompt = getSystemPrompt();

  if (results.length === 0) {
    // Return empty to signal that vector store failed — router.ts will use keywordFallback
    return { retrievedContext: "" };
  }

  const chunks = results.map(r => r.content).join("\n\n---\n\n");
  const context = [systemPrompt, "---", chunks].join("\n\n");
  return { retrievedContext: context };
}

// Conditional edge: decide which path based on route result
function routeDecision(state: typeof AgentState.State): "structured_end" | "retrieve" {
  return state.routeType === "structured" ? "structured_end" : "retrieve";
}

// Node 3: Structured end — just passes through (response already set in routeNode)
function structuredEndNode(state: typeof AgentState.State) {
  return state;
}

// Build the graph
const graph = new StateGraph(AgentState)
  .addNode("route", routeNode)
  .addNode("retrieve", retrieveNode)
  .addNode("structured_end", structuredEndNode)
  .addEdge(START, "route")
  .addConditionalEdges("route", routeDecision, {
    structured_end: "structured_end",
    retrieve: "retrieve",
  })
  .addEdge("structured_end", END)
  .addEdge("retrieve", END)
  .compile();

/**
 * Run the hybrid agent on a query.
 * Returns either:
 * - { type: "structured", response: string } for deterministic queries
 * - { type: "semantic", context: string } for queries needing LLM generation
 */
export async function runHybridAgent(query: string): Promise<
  | { type: "structured"; response: string }
  | { type: "semantic"; context: string }
> {
  // Ensure vector store is initialized
  await initVectorStore();

  const result = await graph.invoke({ query });

  if (result.routeType === "structured" && result.structuredResponse) {
    return { type: "structured", response: result.structuredResponse };
  }

  return { type: "semantic", context: result.retrievedContext };
}
