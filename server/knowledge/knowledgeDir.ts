/**
 * Locates the knowledge base (.md files) on disk.
 *
 * In development this module sits beside them (server/knowledge). The production
 * build bundles the server into dist/index.js, so the build script copies the
 * files to dist/knowledge and they are found there instead.
 */

import fs from "fs";
import path from "path";

const SYSTEM_PROMPT_FILE = "_system.md";

export function resolveKnowledgeDir(): string {
  const candidates = [
    import.meta.dirname,
    path.join(import.meta.dirname, "knowledge"),
    path.join(process.cwd(), "server", "knowledge"),
  ];
  const found = candidates.find(dir => fs.existsSync(path.join(dir, SYSTEM_PROMPT_FILE)));
  if (!found) {
    console.error(`[Knowledge] ${SYSTEM_PROMPT_FILE} not found. Looked in: ${candidates.join(", ")}`);
  }
  return found ?? candidates[0];
}
