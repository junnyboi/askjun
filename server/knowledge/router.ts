/**
 * Knowledge Router — Keyword-based retrieval with token budget.
 * Loads frontmatter .md files at server start, scores by keyword match,
 * returns system prompt + top relevant chunks within token budget.
 *
 * Vector-ready: each chunk has content_hash + version for future embedding cache.
 */

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
  content: string;
}

const PRIORITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };
const MAX_CONTEXT_TOKENS = 2500;

let systemPrompt = "";
let chunks: KnowledgeChunk[] = [];
let loaded = false;

function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
}

function loadKnowledge(): void {
  if (loaded) return;

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
        title: data.title || file,
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        priority: data.priority || "medium",
        tokens: data.tokens || 500,
        contentHash: data.content_hash || computeHash(content),
        version: data.version || 1,
        content: content.trim(),
      });
    } catch (err) {
      console.warn(`[Knowledge] Failed to parse ${file}:`, err);
    }
  }

  loaded = true;
  console.log(`[Knowledge] Loaded ${chunks.length} chunks + system prompt`);
}

/**
 * Get relevant context for a user query.
 * Always includes the system prompt + top matching chunks within token budget.
 */
export function getRelevantContext(query: string): string {
  loadKnowledge();

  const lowerQuery = query.toLowerCase();

  // Score each chunk by keyword matches weighted by priority
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

  // Fallback: if no chunks matched, include the summary
  if (selected.length === 0) {
    const summary = chunks.find(c => c.id === "summary");
    if (summary) selected.push(summary);
  }

  // Always include contact for redirect capability
  const hasContact = selected.some(c => c.id === "contact");
  if (!hasContact) {
    const contact = chunks.find(c => c.id === "contact");
    if (contact) selected.push(contact);
  }

  // Assemble: system prompt + selected chunks
  const contextParts = [systemPrompt, "---", ...selected.map(c => c.content)];
  return contextParts.join("\n\n");
}

/**
 * Export all chunks for potential future use (embedding generation, debugging).
 */
export function getAllChunks(): KnowledgeChunk[] {
  loadKnowledge();
  return chunks;
}

/**
 * Get only the system prompt (for testing/debugging).
 */
export function getSystemPrompt(): string {
  loadKnowledge();
  return systemPrompt;
}
