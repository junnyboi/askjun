import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ENV } from "./_core/env";
import { SYSTEM_PROMPT } from "./knowledge";

// In-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Simple chat counter (resets on server restart, but gives a live feel)
let chatCounter = 0;
const RATE_LIMIT_MAX = 30; // messages per window
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  if (!limit || limit.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  limit.count++;
  return true;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  chat: router({
    stats: publicProcedure.query(() => {
      return { conversations: chatCounter };
    }),
    send: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        chatCounter++;
        // Rate limit by IP
        const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
        if (!checkRateLimit(ip)) {
          return {
            content:
              "I've reached the message limit for this session. Please try again in an hour, or reach Jun directly at **boh.ze.jun@gmail.com**.",
            rateLimited: true,
          };
        }

        try {
          const forgeUrl = ENV.forgeApiUrl
            ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
            : "https://forge.manus.im/v1/chat/completions";

          // Build messages with system prompt + last 10 user messages
          const chatMessages = [
            { role: "system" as const, content: SYSTEM_PROMPT },
            ...input.messages.slice(-10),
          ];

          const response = await fetch(forgeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.forgeApiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: chatMessages,
              max_tokens: 1024,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => "");
            console.error(`[Chat] LLM error: ${response.status} ${errText}`);
            return {
              content:
                "I'm having trouble connecting right now. Please try again in a moment, or reach Jun directly at **boh.ze.jun@gmail.com**.",
              rateLimited: false,
            };
          }

          const data = (await response.json()) as {
            choices: Array<{
              message: { content: string };
            }>;
          };

          const content =
            data.choices?.[0]?.message?.content ||
            "I couldn't generate a response. Please try asking something else.";

          return { content, rateLimited: false };
        } catch (error) {
          console.error("[Chat] Error:", error);
          return {
            content:
              "Something went wrong. Please try again, or reach Jun directly at **boh.ze.jun@gmail.com**.",
            rateLimited: false,
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
