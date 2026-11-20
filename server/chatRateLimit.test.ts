import { describe, expect, it } from "vitest";
import { allowModelCall, allowVisitorQuestion } from "./chatRateLimit";

describe("chat rate limits", () => {
  it("allows a visitor 30 questions an hour, then refuses until the hour is up", () => {
    const start = 1_000_000;
    const results = Array.from({ length: 31 }, () => allowVisitorQuestion("203.0.113.7", start));
    expect(results.slice(0, 30).every(Boolean)).toBe(true);
    expect(results[30]).toBe(false);
    expect(allowVisitorQuestion("203.0.113.7", start + 60 * 60 * 1000 + 1)).toBe(true);
  });

  it("counts each visitor separately", () => {
    const start = 2_000_000;
    for (let i = 0; i < 30; i++) allowVisitorQuestion("203.0.113.8", start);
    expect(allowVisitorQuestion("203.0.113.8", start)).toBe(false);
    expect(allowVisitorQuestion("198.51.100.9", start)).toBe(true);
  });

  it("caps model calls for the whole site at 300 an hour", () => {
    const start = 10_000_000_000;
    const results = Array.from({ length: 301 }, () => allowModelCall(start));
    expect(results.slice(0, 300).every(Boolean)).toBe(true);
    expect(results[300]).toBe(false);
    expect(allowModelCall(start + 60 * 60 * 1000 + 1)).toBe(true);
  });
});
