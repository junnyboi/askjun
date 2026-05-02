import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ENV } from "./_core/env";
import { SYSTEM_PROMPT } from "./knowledge";
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

  // Admin dashboard — password-gated on the frontend
  admin: router({
    verify: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        return { valid: input.password === "mijun" };
      }),
    stats: publicProcedure
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
    visitors: publicProcedure
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
    topQuestions: publicProcedure
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
    recentEvents: publicProcedure
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
    dailyTraffic: publicProcedure
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
