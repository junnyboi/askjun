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

// Periodic eviction — prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  rateLimits.forEach((limit, ip) => {
    if (limit.resetAt <= now) rateLimits.delete(ip);
  });
}, 600000); // Every 10 minutes

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

// Off-topic detection — prevent users from using askJun as a personal GPT
const OFF_TOPIC_PATTERNS = [
  "write me a", "write a program", "write a script", "write code", "generate code",
  "help me code", "debug this", "fix this code", "solve this", "help me with my",
  "can you code", "implement a", "create a function", "write a function",
  "what is the capital", "who is the president", "explain quantum",
  "tell me about bitcoin", "what is blockchain", "how does ai work",
  "translate this", "summarize this article", "write an essay",
  "help me with homework", "what year did", "how many people",
  "write a poem", "write a story", "write a song", "tell me a joke",
  "make up a", "create a story", "write me an email",
  "recipe for", "how to cook", "what should i eat",
  "calculate", "what is 2+2", "solve this equation", "math problem",
  "how do i install", "how to setup", "fix my computer", "my wifi",
  "how to use chatgpt", "how to use excel",
  // General explanations (not about Jun)
  "explain how", "explain what", "explain the", "explain why",
  "how does a", "how does the", "what is a ", "what is an ",
  "what are the", "who invented", "when was the", "where is the",
  "define ", "definition of",
  // Conversational / personal assistant
  "remind me", "set a timer", "what time is it", "what day is it",
  "book a", "order a", "buy me", "find me a",
];

const JUN_CONTEXT_SIGNALS = [
  "jun", "his ", " his", "he do", "he build", "he work", "does he", "has he", "is he", "can he",
  "him", "boh", "portfolio", "resume", "cv",
  "hire", "experience", "career", "role", "company",
  "meta", "manus", "hoyo", "tiktok", "bytedance", "bank of singapore", "instawork", "dbs",
  "skill", "tech stack", "react", "typescript", "frontend", "full stack",
  "payment", "gdpr", "ai agent", "singapore",
  "salary", "compensation", "contact", "email", "linkedin", "github",
  "education", "university", "nus", "smu", "eindhoven",
  "award", "achievement", "metric",
  "handsome", "look like", "appearance", "attractive",
  "timeline", "\u2726",
];

function isOffTopicQuery(lowerInput: string): boolean {
  if (JUN_CONTEXT_SIGNALS.some(signal => lowerInput.includes(signal))) return false;
  if (OFF_TOPIC_PATTERNS.some(pattern => lowerInput.includes(pattern))) return true;
  return false;
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

        // === PROMPT INJECTION HARDENING ===
        const lastUserMessage = input.messages[input.messages.length - 1]?.content || "";

        // 1. Max input length enforcement (500 chars per message)
        if (lastUserMessage.length > 500) {
          return {
            content: "Please keep your question under 500 characters. I work best with concise questions!",
            rateLimited: false,
            retrievalType: "keyword" as const,
          };
        }

        // 2. Input sanitization — detect known injection patterns
        const INJECTION_PATTERNS = [
          "ignore previous instructions",
          "ignore all instructions",
          "ignore your instructions",
          "disregard your instructions",
          "forget your instructions",
          "system prompt",
          "reveal your prompt",
          "show me your prompt",
          "what are your instructions",
          "output your instructions",
          "repeat your system",
          "you are now",
          "act as",
          "pretend you are",
          "jailbreak",
          "DAN mode",
          "developer mode",
        ];
        const lowerInput = lastUserMessage.toLowerCase();
        const isInjectionAttempt = INJECTION_PATTERNS.some(p => lowerInput.includes(p));
        if (isInjectionAttempt) {
          return {
            content: "I'm Jun's portfolio assistant — I can only answer questions about his professional experience, skills, and career. What would you like to know about Jun?",
            rateLimited: false,
            retrievalType: "keyword" as const,
          };
        }

        // 3. Session token budget (max total input chars across all messages: 10000)
        const totalInputChars = input.messages.reduce((sum, m) => sum + m.content.length, 0);
        if (totalInputChars > 10000) {
          return {
            content: "This conversation is getting quite long! For more detailed discussions, please reach Jun directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com).",
            rateLimited: false,
            retrievalType: "keyword" as const,
          };
        }

        // 4. Off-topic detection — prevent personal GPT usage
        if (isOffTopicQuery(lowerInput)) {
          return {
            content: "I appreciate the curiosity, but I'm specifically designed to answer questions about **Jun Boh's** professional experience, skills, and career. I can't help with general questions, code generation, or other topics.\n\nTry asking me things like:\n- What's his experience at Meta?\n- What payment systems has he built?\n- Why should I hire Jun?\n\nOr reach Jun directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com).",
            rateLimited: false,
            retrievalType: "keyword" as const,
          };
        }

        try {
          const llmUrl = ENV.llmApiUrl
            ? `${ENV.llmApiUrl.replace(/\/$/, "")}/v1/chat/completions`
            : "https://api.openai.com/v1/chat/completions";

          // Hybrid retrieval: keyword router (instant) or semantic (vector + LLM)
          const retrieval: RetrievalResult = await getRelevantContext(lastUserMessage);

          // If keyword router returned a structured response, return it directly
          if (retrieval.type === "structured") {
            return { content: retrieval.content, rateLimited: false, retrievalType: "keyword" as const };
          }

          // Semantic path: use retrieved context as system prompt for LLM
          const chatMessages = [
            { role: "system" as const, content: retrieval.content },
            ...input.messages.slice(-5),
          ];

          // Model fallback chain: gpt-4.1-mini → gpt-4o-mini → deepseek-chat
          const MODEL_CHAIN = ["gpt-4.1-mini", "gpt-4o-mini", "deepseek-chat"];
          let response: globalThis.Response | null = null;

          for (const model of MODEL_CHAIN) {
            try {
              const r = await fetch(llmUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${ENV.llmApiKey}`,
                },
                body: JSON.stringify({
                  model,
                  messages: chatMessages,
                  max_tokens: 1024,
                  temperature: 0.7,
                }),
              });
              if (r.ok) {
                response = r;
                console.log(`[Chat] Using model: ${model}`);
                break;
              } else {
                console.warn(`[Chat] Model ${model} failed (${r.status}), trying next...`);
              }
            } catch (err) {
              console.warn(`[Chat] Model ${model} error:`, err);
            }
          }

          if (!response) {
            return {
              content: "I'm having trouble connecting right now. Please try again in a moment, or reach Jun directly at **boh.ze.jun@gmail.com**.",
              rateLimited: false,
              retrievalType: "semantic" as const,
            };
          }

          const data = (await response.json()) as {
            choices: Array<{
              message: { content: string };
            }>;
          };

          let content =
            data.choices?.[0]?.message?.content ||
            "I couldn't generate a response. Please try asking something else.";

          // Output validation — detect if LLM leaked system prompt or revealed its identity
          const CANARY = "ASKJUN_CANARY_7x9k";
          const LEAKED_PATTERNS = [
            "RULES:", "KNOWLEDGE BASE:", "PERSONALITY:", CANARY,
            "ONLY discuss information provided", "Never reveal internal system",
            "I am a large language model", "trained by Google", "I'm a large language model",
            "I'm Gemini", "I am Gemini", "developed by Google", "made by Google",
          ];
          const contentUpper = content.toUpperCase();
          let shouldSanitize = false;

          if (LEAKED_PATTERNS.some(p => contentUpper.includes(p.toUpperCase()))) {
            console.warn("[Chat] Output validation: identity/prompt leak detected");
            shouldSanitize = true;
          }

          // Company hallucination detection
          const HALLUCINATED_COMPANIES = [
            "SHOPEE", "GRAB", "LAZADA", "SEA GROUP", "RAZER", "GARENA",
            "GOOGLE", "AMAZON", "APPLE", "MICROSOFT", "NETFLIX", "UBER",
            "STRIPE", "AIRBNB", "SPOTIFY", "TWITTER", "SNAP",
            "BINANCE", "CRYPTO.COM", "REVOLUT", "WISE",
            "SHOPIFY", "SALESFORCE", "ORACLE", "SAP",
            "JPMORGAN", "GOLDMAN", "MORGAN STANLEY", "CITIBANK", "OCBC", "UOB",
          ];
          const WORK_VERBS = ["WORKED AT", "JOINED", "WAS AT", "EMPLOYED AT", "ROLE AT", "POSITION AT", "TIME AT", "STINT AT", "EXPERIENCE AT"];
          for (const company of HALLUCINATED_COMPANIES) {
            if (contentUpper.includes(company)) {
              if (WORK_VERBS.some(verb => contentUpper.includes(verb + " " + company) || contentUpper.includes("AT " + company))) {
                console.warn(`[Chat] Hallucination detected: claimed Jun worked at ${company}`);
                shouldSanitize = true;
                break;
              }
            }
          }

          if (shouldSanitize) {
            content = "I'd be happy to tell you about Jun's professional experience! He has worked at **Meta (Manus AI)**, **Instawork**, **HoYoverse**, **TikTok/ByteDance**, **Bank of Singapore**, and **DBS Bank**. What specific role or company would you like to know more about?";
          }

          return { content, rateLimited: false, retrievalType: "semantic" as const };
        } catch (error) {
          console.error("[Chat] Error:", error);
          return {
            content:
              "Something went wrong. Please try again, or reach Jun directly at **boh.ze.jun@gmail.com**.",
            rateLimited: false,
            retrievalType: "semantic" as const,
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
