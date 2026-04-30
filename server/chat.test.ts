import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      protocol: "https",
      headers: {},
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("chat.send", () => {
  it("returns a response for a valid message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [{ role: "user", content: "What tech stack does Jun use?" }],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("rateLimited");
  });

  it("accepts multiple messages for context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.send({
      messages: [
        { role: "user", content: "Tell me about Jun" },
        { role: "assistant", content: "Jun is a senior engineer..." },
        { role: "user", content: "What about his payment systems work?" },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });
});
