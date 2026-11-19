import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { resolveKnowledgeDir } from "./knowledgeDir";
import { semanticResult } from "./router";

describe("resolveKnowledgeDir", () => {
  it("finds the directory holding the system prompt and the knowledge chunks", () => {
    const dir = resolveKnowledgeDir();
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
    expect(fs.existsSync(path.join(dir, "_system.md"))).toBe(true);
    expect(files).toContain("role-meta.md");
    expect(files.length).toBeGreaterThan(10);
  });
});

describe("semanticResult", () => {
  it("passes the context to the model when the system prompt is loaded", () => {
    const result = semanticResult("prompt\n\n---\n\nchunk", "prompt");
    expect(result).toEqual({ type: "semantic", content: "prompt\n\n---\n\nchunk" });
  });

  it("does not call the model when the system prompt is missing", () => {
    const result = semanticResult("\n\n---", "");
    expect(result.type).toBe("structured");
    expect(result.content).toContain("boh.ze.jun@gmail.com");
    expect(result.content).toContain("linkedin.com/in/junboh");
  });
});
