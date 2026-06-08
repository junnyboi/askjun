import { describe, expect, it } from "vitest";
import { keywordRoute } from "./keywordRouter";

describe("keywordRouter", () => {
  it("routes email queries to contact response", () => {
    const result = keywordRoute("What's his email?");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("contact");
    expect(result!.response).toContain("boh.ze.jun@gmail.com");
  });

  it("routes GitHub queries to github response", () => {
    const result = keywordRoute("Show me his GitHub");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("github");
    expect(result!.response).toContain("github.com/junnyboi");
  });

  it("routes resume queries to cv response", () => {
    const result = keywordRoute("Can I download his resume?");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("resume");
    expect(result!.response).toContain("Download CV");
  });

  it("routes handsome queries to easter egg", () => {
    const result = keywordRoute("Is Jun handsome?");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("easter_egg");
    expect(result!.response).toContain("gorgeous");
  });

  it("returns null for ambiguous/semantic queries", () => {
    const result = keywordRoute("How does he approach building scalable systems?");
    expect(result).toBeNull();
  });

  it("returns null for conversational queries about experience", () => {
    const result = keywordRoute("Tell me about his work at the gaming company");
    expect(result).toBeNull();
  });
});
