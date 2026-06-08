/**
 * Knowledge Router — Hybrid retrieval interface.
 *
 * Uses LangGraph hybrid agent:
 * 1. Keyword Router (deterministic) for explicit queries → instant response
 * 2. Vector Similarity (semantic) for conversational queries → context for LLM
 *
 * Falls back to keyword-only scoring if vector store fails to initialize.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import crypto from "crypto";
import { runHybridAgent } from "./agent";
import { keywordRoute } from "./keywordRouter";

// ============================================================================
// FALLBACK: Keyword-only router (used when vector store is unavailable)
// ============================================================================

interface KnowledgeChunk {
  id: string;
  keywords: string[];
  priority: "high" | "medium" | "low";
  tokens: number;
  content: string;
}

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };
const MAX_CONTEXT_TOKENS = 2500;

let systemPrompt = "";
let chunks: KnowledgeChunk[] = [];
let fallbackLoaded = false;

function loadFallbackKnowledge(): void {
  if (fallbackLoaded) return;
  const dir = path.resolve(import.meta.dirname);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      if (file === "_system.md") {
        systemPrompt = content.trim();
        continue;
      }
      chunks.push({
        id: data.id || file.replace(".md", ""),
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        priority: data.priority || "medium",
        tokens: data.tokens || 500,
        content: content.trim(),
      });
    } catch {}
  }
  fallbackLoaded = true;
}

function keywordFallback(query: string): string {
  loadFallbackKnowledge();
  const lowerQuery = query.toLowerCase();
  const scored = chunks
    .map(chunk => ({
      ...chunk,
      score: chunk.keywords.filter(kw => lowerQuery.includes(kw)).length * PRIORITY_WEIGHT[chunk.priority],
    }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  let tokenBudget = MAX_CONTEXT_TOKENS;
  const selected: KnowledgeChunk[] = [];
  for (const chunk of scored) {
    if (tokenBudget <= 0) break;
    selected.push(chunk);
    tokenBudget -= chunk.tokens;
  }

  if (selected.length === 0) {
    const summary = chunks.find(c => c.id === "summary");
    if (summary) selected.push(summary);
  }

  const contact = chunks.find(c => c.id === "contact");
  if (contact && !selected.some(c => c.id === "contact")) selected.push(contact);

  return [systemPrompt, "---", ...selected.map(c => c.content)].join("\n\n");
}

// ============================================================================
// PRIMARY: Hybrid agent (keyword + vector)
// ============================================================================

export interface RetrievalResult {
  type: "structured" | "semantic";
  content: string;  // Either the final response (structured) or context for LLM (semantic)
}

/**
 * Get relevant context for a user query using the hybrid agent.
 * Returns a RetrievalResult indicating whether the response is final (structured)
 * or needs LLM generation (semantic context).
 */
export async function getRelevantContext(query: string): Promise<RetrievalResult> {
  try {
    const result = await runHybridAgent(query);

    if (result.type === "structured") {
      return { type: "structured", content: result.response };
    }

    // Semantic: if context is empty (vector store failed), use keyword fallback
    if (!result.context || result.context.length < 100) {
      return { type: "semantic", content: keywordFallback(query) };
    }

    return { type: "semantic", content: result.context };
  } catch (err) {
    console.warn("[Router] Hybrid agent failed, using keyword fallback:", err);
    // Check keyword router first even in fallback
    const kwMatch = keywordRoute(query);
    if (kwMatch) {
      return { type: "structured", content: kwMatch.response };
    }
    return { type: "semantic", content: keywordFallback(query) };
  }
}
