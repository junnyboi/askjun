import { TRPCError } from "@trpc/server";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ENV } from "./_core/env";
import { getRelevantContext, type RetrievalResult } from "./knowledge/router";
import { getDb } from "./db";
import { analyticsEvents, visitors } from "../drizzle/schema";
import { eq, desc, sql, count, and, gte, lte } from "drizzle-orm";

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

// Server-side admin gate middleware
const adminGatedProcedure = publicProcedure.use(({ ctx, next }) => {
  const password = ctx.req.headers["x-admin-password"] as string | undefined;
  if (password !== ENV.adminPassword) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  chat: router({
    stats: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { conversations: chatCounter };
      try {
        const [result] = await db.select({ count: count() }).from(analyticsEvents).where(eq(analyticsEvents.event, "chat_message"));
        return { conversations: result?.count || chatCounter };
      } catch {
        return { conversations: chatCounter };
      }
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
          const llmUrl = ENV.llmApiUrl
            ? `${ENV.llmApiUrl.replace(/\/$/, "")}/v1/chat/completions`
            : "https://api.openai.com/v1/chat/completions";

          // Hybrid retrieval: keyword router (instant) or semantic (vector + LLM)
          const lastUserMessage = input.messages[input.messages.length - 1]?.content || "";
          const retrieval: RetrievalResult = await getRelevantContext(lastUserMessage);

          // If keyword router returned a structured response, return it directly
          if (retrieval.type === "structured") {
            return { content: retrieval.content, rateLimited: false };
          }

          // Semantic path: use retrieved context as system prompt for LLM
          const chatMessages = [
            { role: "system" as const, content: retrieval.content },
            ...input.messages.slice(-5),
          ];

          const response = await fetch(llmUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.llmApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
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

  // Analytics tracking — called from frontend
  track: router({
    event: publicProcedure
      .input(z.object({
        event: z.string(),
        data: z.string().optional(),
        sessionId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const ip = ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
        const userAgent = ctx.req.headers["user-agent"] || "";
          // Geo-IP lookup (non-blocking, best-effort)
          let country: string | null = null;
          try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country`, { signal: AbortSignal.timeout(2000) });
            if (geoRes.ok) {
              const geo = await geoRes.json() as { country?: string };
              country = geo.country || null;
            }
          } catch { /* silent fail on geo lookup */ }

          // Upsert visitor
        try {
          const existing = await db.select().from(visitors).where(eq(visitors.ip, ip)).limit(1);
          if (existing.length > 0) {
            await db.update(visitors).set({ visitCount: sql`${visitors.visitCount} + 1`, lastVisit: new Date(), ...(country ? { country } : {}) }).where(eq(visitors.ip, ip));
          } else {
            await db.insert(visitors).values({ ip, userAgent, ...(country ? { country } : {}) });
          }
          // Insert event
          await db.insert(analyticsEvents).values({
            event: input.event,
            data: input.data || null,
            ip,
            userAgent,
            sessionId: input.sessionId || null,
          });
        } catch (e) {
          console.error("[Track] Error:", e);
        }
        return { success: true };
      }),
  }),

  // Admin dashboard — server-side password gated
  admin: router({
    verify: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        return { valid: input.password === ENV.adminPassword };
      }),
    stats: adminGatedProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { totalEvents: 0, totalVisitors: 0, cvDownloads: 0, chatMessages: 0, chipClicks: 0 };
        try {
          const dateFilters = [];
          if (input?.from) dateFilters.push(gte(analyticsEvents.createdAt, new Date(input.from)));
          if (input?.to) dateFilters.push(lte(analyticsEvents.createdAt, new Date(input.to + "T23:59:59")));
          const whereClause = dateFilters.length > 0 ? and(...dateFilters) : undefined;

          const [totalEvents] = await db.select({ count: count() }).from(analyticsEvents).where(whereClause);
          const [totalVisitors] = await db.select({ count: count() }).from(visitors);
          const [cvDownloads] = await db.select({ count: count() }).from(analyticsEvents).where(whereClause ? and(eq(analyticsEvents.event, "cv_download"), ...dateFilters) : eq(analyticsEvents.event, "cv_download"));
          const [chatMessages] = await db.select({ count: count() }).from(analyticsEvents).where(whereClause ? and(eq(analyticsEvents.event, "chat_message"), ...dateFilters) : eq(analyticsEvents.event, "chat_message"));
          const [chipClicks] = await db.select({ count: count() }).from(analyticsEvents).where(whereClause ? and(eq(analyticsEvents.event, "chip_click"), ...dateFilters) : eq(analyticsEvents.event, "chip_click"));
          return {
            totalEvents: totalEvents?.count || 0,
            totalVisitors: totalVisitors?.count || 0,
            cvDownloads: cvDownloads?.count || 0,
            chatMessages: chatMessages?.count || 0,
            chipClicks: chipClicks?.count || 0,
          };
        } catch { return { totalEvents: 0, totalVisitors: 0, cvDownloads: 0, chatMessages: 0, chipClicks: 0 }; }
      }),
    visitors: adminGatedProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        try {
          const filters = [];
          if (input?.from) filters.push(gte(visitors.lastVisit, new Date(input.from)));
          if (input?.to) filters.push(lte(visitors.lastVisit, new Date(input.to + "T23:59:59")));
          const whereClause = filters.length > 0 ? and(...filters) : undefined;
          return await db.select().from(visitors).where(whereClause).orderBy(desc(visitors.lastVisit)).limit(50);
        } catch { return []; }
      }),
    topQuestions: adminGatedProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        try {
          const filters = [eq(analyticsEvents.event, "chat_message")];
          if (input?.from) filters.push(gte(analyticsEvents.createdAt, new Date(input.from)));
          if (input?.to) filters.push(lte(analyticsEvents.createdAt, new Date(input.to + "T23:59:59")));
          const results = await db.select({
            data: analyticsEvents.data,
            count: count(),
          }).from(analyticsEvents)
            .where(and(...filters))
            .groupBy(analyticsEvents.data)
            .orderBy(desc(count()))
            .limit(20);
          return results;
        } catch { return []; }
      }),
    recentEvents: adminGatedProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        try {
          const filters = [];
          if (input?.from) filters.push(gte(analyticsEvents.createdAt, new Date(input.from)));
          if (input?.to) filters.push(lte(analyticsEvents.createdAt, new Date(input.to + "T23:59:59")));
          const whereClause = filters.length > 0 ? and(...filters) : undefined;
          return await db.select().from(analyticsEvents).where(whereClause).orderBy(desc(analyticsEvents.createdAt)).limit(100);
        } catch { return []; }
      }),
    dailyTraffic: adminGatedProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        try {
          const filters = [];
          if (input?.from) filters.push(gte(analyticsEvents.createdAt, new Date(input.from)));
          if (input?.to) filters.push(lte(analyticsEvents.createdAt, new Date(input.to + "T23:59:59")));
          const whereClause = filters.length > 0 ? and(...filters) : undefined;
          const results = await db.select({
            date: sql<string>`DATE(${analyticsEvents.createdAt})`,
            events: count(),
          }).from(analyticsEvents)
            .where(whereClause)
            .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
            .orderBy(sql`DATE(${analyticsEvents.createdAt})`);
          return results;
        } catch { return []; }
      }),
  }),
});

export type AppRouter = typeof appRouter;
