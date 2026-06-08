/**
 * Vector Store — In-memory embeddings with file-based cache.
 * Embeds all knowledge chunks using text-embedding-3-small at startup.
 * Caches embeddings to disk so subsequent restarts are instant (no API calls).
 * Uses cosine similarity for semantic retrieval.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import crypto from "crypto";
import { ENV } from "../_core/env";

interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  contentHash: string;
  version: number;
  tokens: number;
  embedding?: number[];
}

interface EmbeddingCache {
  model: string;
  chunks: Record<string, { content_hash: string; version: number; embedding: number[] }>;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const CACHE_PATH = path.resolve(import.meta.dirname, ".embeddings-cache.json");

let chunks: KnowledgeChunk[] = [];
let systemPrompt = "";
let initialized = false;

function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
}

function loadCache(): EmbeddingCache | null {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    }
  } catch {
    console.warn("[VectorStore] Failed to load embedding cache, will re-embed");
  }
  return null;
}

function saveCache(cache: EmbeddingCache): void {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf-8");
  } catch (err) {
    console.warn("[VectorStore] Failed to save embedding cache:", err);
  }
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiUrl = ENV.llmApiUrl
    ? `${ENV.llmApiUrl.replace(/\/$/, "")}/v1/embeddings`
    : "https://api.openai.com/v1/embeddings";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.llmApiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Embedding API error: ${response.status} ${err}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data.map(d => d.embedding);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Initialize the vector store: load chunks, compute/cache embeddings.
 */
export async function initVectorStore(): Promise<void> {
  if (initialized) return;

  const dir = path.resolve(import.meta.dirname);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
  const cache = loadCache();
  const newCache: EmbeddingCache = { model: EMBEDDING_MODEL, chunks: {} };
  const chunksToEmbed: { index: number; text: string }[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);

      if (file === "_system.md") {
        systemPrompt = content.trim();
        continue;
      }

      const id = data.id || file.replace(".md", "");
      const contentHash = data.content_hash || computeHash(content);
      const version = data.version || 1;

      const chunk: KnowledgeChunk = {
        id,
        title: data.title || file,
        content: content.trim(),
        contentHash,
        version,
        tokens: data.tokens || 500,
      };

      // Check cache: if hash matches, use cached embedding
      const cached = cache?.chunks[id];
      if (cached && cached.content_hash === contentHash && cache?.model === EMBEDDING_MODEL) {
        chunk.embedding = cached.embedding;
        newCache.chunks[id] = cached;
      } else {
        // Need to embed this chunk
        chunksToEmbed.push({ index: chunks.length, text: content.trim() });
      }

      chunks.push(chunk);
    } catch (err) {
      console.warn(`[VectorStore] Failed to parse ${file}:`, err);
    }
  }

  // Embed any chunks that weren't in cache
  if (chunksToEmbed.length > 0) {
    try {
      console.log(`[VectorStore] Embedding ${chunksToEmbed.length} chunks...`);
      const texts = chunksToEmbed.map(c => c.text);
      const embeddings = await embedTexts(texts);

      for (let i = 0; i < chunksToEmbed.length; i++) {
        const { index } = chunksToEmbed[i];
        chunks[index].embedding = embeddings[i];
        newCache.chunks[chunks[index].id] = {
          content_hash: chunks[index].contentHash,
          version: chunks[index].version,
          embedding: embeddings[i],
        };
      }
      console.log(`[VectorStore] Embedded ${chunksToEmbed.length} chunks successfully`);
    } catch (err) {
      console.warn("[VectorStore] Embedding failed, falling back to keyword-only:", err);
      // Chunks without embeddings will be skipped in similarity search
    }
  }

  // Merge existing cached chunks that didn't need re-embedding
  for (const chunk of chunks) {
    if (chunk.embedding && !newCache.chunks[chunk.id]) {
      newCache.chunks[chunk.id] = {
        content_hash: chunk.contentHash,
        version: chunk.version,
        embedding: chunk.embedding,
      };
    }
  }

  saveCache(newCache);
  initialized = true;
  console.log(`[VectorStore] Initialized with ${chunks.length} chunks (${chunksToEmbed.length} newly embedded)`);
}

/**
 * Semantic similarity search — returns top N most relevant chunks.
 */
export async function similaritySearch(query: string, topK: number = 3): Promise<KnowledgeChunk[]> {
  await initVectorStore();

  // Embed the query
  let queryEmbedding: number[];
  try {
    const [embedding] = await embedTexts([query]);
    queryEmbedding = embedding;
  } catch {
    // If embedding fails, return empty (caller should fall back to keyword)
    return [];
  }

  // Score all chunks by cosine similarity
  const scored = chunks
    .filter(c => c.embedding) // Only chunks with embeddings
    .map(c => ({
      ...c,
      similarity: cosineSimilarity(queryEmbedding, c.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

/**
 * Get the system prompt (always included in context).
 */
export function getSystemPrompt(): string {
  return systemPrompt;
}

/**
 * Get all chunks (for debugging/testing).
 */
export function getAllChunks(): KnowledgeChunk[] {
  return chunks;
}
