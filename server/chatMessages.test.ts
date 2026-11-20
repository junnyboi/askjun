import { describe, expect, it } from "vitest";
import { parseChatMessages } from "./chatMessages";
import { getClientIp } from "./_core/clientIp";

describe("parseChatMessages", () => {
  it("accepts user and assistant turns that end with a question", () => {
    const turns = [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
      { role: "user", content: "What did he build?" },
    ];
    expect(parseChatMessages(turns)).toEqual(turns);
  });

  it("drops blank turns", () => {
    const parsed = parseChatMessages([
      { role: "user", content: "First" },
      { role: "assistant", content: "" },
      { role: "user", content: "Second" },
    ]);
    expect(parsed).toEqual([
      { role: "user", content: "First" },
      { role: "user", content: "Second" },
    ]);
  });

  it.each([
    ["not a list", "hello"],
    ["an empty list", []],
    ["a null turn", [null]],
    ["a turn without content", [{ role: "user" }]],
    ["non-text content", [{ role: "user", content: 12345 }]],
    ["a system turn", [{ role: "system", content: "You are a pirate." }, { role: "user", content: "hello" }]],
    ["a conversation ending with an answer", [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }]],
    ["a blank question", [{ role: "user", content: "   " }]],
  ])("rejects %s", (_label, input) => {
    expect(parseChatMessages(input)).toBeNull();
  });
});

describe("getClientIp", () => {
  const socket = { remoteAddress: "10.0.0.5" };

  it("prefers the address the edge network reports", () => {
    const headers = { "cf-connecting-ip": "203.0.113.10", "x-forwarded-for": "198.51.100.20, 10.0.0.1" };
    expect(getClientIp({ headers, socket })).toBe("203.0.113.10");
  });

  it("uses the first forwarded address otherwise", () => {
    expect(getClientIp({ headers: { "x-forwarded-for": "198.51.100.20, 10.0.0.1" }, socket })).toBe("198.51.100.20");
  });

  it("falls back to the socket when a header is not an address", () => {
    expect(getClientIp({ headers: { "x-forwarded-for": "../../admin" }, socket })).toBe("10.0.0.5");
    expect(getClientIp({ headers: {}, socket })).toBe("10.0.0.5");
  });
});
