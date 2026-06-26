/**
 * Chat Streaming Endpoint — Server-Sent Events (SSE)
 * Real-time token streaming from the LLM to the frontend.
 * Falls back to full response if streaming is not supported.
 */

import { Request, Response } from "express";
import { ENV } from "./_core/env";
import { getRelevantContext } from "./knowledge/router";

// Rate limiting (shared with tRPC endpoint)
const streamRateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 3600000;

// Periodic eviction — prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  streamRateLimits.forEach((limit, ip) => {
    if (limit.resetAt <= now) streamRateLimits.delete(ip);
  });
}, 600000); // Every 10 minutes

function checkStreamRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = streamRateLimits.get(ip);
  if (!limit || limit.resetAt <= now) {
    streamRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (limit.count >= RATE_LIMIT_MAX) return false;
  limit.count++;
  return true;
}

// Injection patterns (shared with tRPC endpoint)
const INJECTION_PATTERNS = [
  "ignore previous instructions", "ignore all instructions", "ignore your instructions",
  "disregard your instructions", "forget your instructions", "system prompt",
  "reveal your prompt", "show me your prompt", "what are your instructions",
  "output your instructions", "repeat your system", "you are now",
  "act as", "pretend you are", "jailbreak", "DAN mode", "developer mode",
];

const CANARY = "ASKJUN_CANARY_7x9k";
const LEAKED_PATTERNS = [
  "RULES:", "KNOWLEDGE BASE:", "PERSONALITY:", CANARY,
  "ONLY discuss information provided", "Never reveal internal system",
  // Identity leak detection — model revealing itself instead of acting as askJun
  "I am a large language model", "trained by Google", "I'm a large language model",
  "I am an AI assistant made by", "I'm Gemini", "I am Gemini",
  "developed by Google", "created by Google", "made by Google DeepMind",
];

// Off-topic detection — catches queries clearly unrelated to Jun's portfolio
// Uses negative signals (off-topic indicators) and positive signals (Jun-related terms)
const OFF_TOPIC_PATTERNS = [
  // Code generation / homework
  "write me a", "write a program", "write a script", "write code", "generate code",
  "help me code", "debug this", "fix this code", "solve this", "help me with my",
  "can you code", "implement a", "create a function", "write a function",
  // General knowledge / personal GPT usage
  "what is the capital", "who is the president", "explain quantum",
  "tell me about bitcoin", "what is blockchain", "how does ai work",
  "translate this", "summarize this article", "write an essay",
  "help me with homework", "what year did", "how many people",
  // Creative writing
  "write a poem", "write a story", "write a song", "tell me a joke",
  "make up a", "create a story", "write me an email",
  // Recipes / lifestyle
  "recipe for", "how to cook", "what should i eat",
  // Math / calculations
  "calculate", "what is 2+2", "solve this equation", "math problem",
  // Unrelated tech support
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

// Positive signals that indicate the query IS about Jun (override off-topic detection)
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

function isOffTopic(lowerInput: string): boolean {
  // If the query contains Jun-related context signals, it's on-topic
  if (JUN_CONTEXT_SIGNALS.some(signal => lowerInput.includes(signal))) {
    return false;
  }
  // If the query matches off-topic patterns, reject it
  if (OFF_TOPIC_PATTERNS.some(pattern => lowerInput.includes(pattern))) {
    return true;
  }
  // Short greetings and ambiguous queries are allowed through (the LLM system prompt handles them)
  return false;
}

export async function chatStreamHandler(req: Request, res: Response) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";

  // Rate limit
  if (!checkStreamRateLimit(ip)) {
    res.status(429).json({ error: "Rate limited. Try again in an hour." });
    return;
  }

  const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Messages array required" });
    return;
  }

  const lastUserMessage = messages[messages.length - 1]?.content || "";

  // Input validation
  if (lastUserMessage.length > 500) {
    res.json({ type: "structured", content: "Please keep your question under 500 characters." });
    return;
  }

  const lowerInput = lastUserMessage.toLowerCase();
  if (INJECTION_PATTERNS.some(p => lowerInput.includes(p))) {
    res.json({ type: "structured", content: "I'm Jun's portfolio assistant — I can only answer questions about his professional experience, skills, and career." });
    return;
  }

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalChars > 10000) {
    res.json({ type: "structured", content: "This conversation is getting quite long! Please reach Jun directly at boh.ze.jun@gmail.com." });
    return;
  }

  // Off-topic detection — prevent users from using askJun as a personal GPT
  if (isOffTopic(lowerInput)) {
    res.json({
      type: "structured",
      content: "I appreciate the curiosity, but I'm specifically designed to answer questions about **Jun Boh's** professional experience, skills, and career. I can't help with general questions, code generation, or other topics.\n\nTry asking me things like:\n- What's his experience at Meta?\n- What payment systems has he built?\n- Why should I hire Jun?\n\nOr reach Jun directly at [boh.ze.jun@gmail.com](mailto:boh.ze.jun@gmail.com).",
      retrievalType: "keyword",
    });
    return;
  }

  // Hybrid retrieval
  const retrieval = await getRelevantContext(lastUserMessage);

  // Keyword (instant) responses — return as JSON, no streaming needed
  if (retrieval.type === "structured") {
    res.json({ type: "structured", content: retrieval.content, retrievalType: "keyword" });
    return;
  }

  // Semantic path — stream from LLM via SSE
  const llmUrl = ENV.llmApiUrl
    ? `${ENV.llmApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

  const chatMessages = [
    { role: "system", content: retrieval.content },
    ...messages.slice(-5),
  ];

  // Model fallback chain: gpt-4.1-mini → gpt-4o-mini → deepseek-chat
  const MODEL_FALLBACK_CHAIN = ["gpt-4.1-mini", "gpt-4o-mini", "deepseek-chat"];

  let llmResponse: globalThis.Response | null = null;
  let usedModel = MODEL_FALLBACK_CHAIN[0];

  try {
    for (const model of MODEL_FALLBACK_CHAIN) {
      try {
        const response = await fetch(llmUrl, {
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
            stream: true,
          }),
        });

        if (response.ok && response.body) {
          llmResponse = response;
          usedModel = model;
          console.log(`[ChatStream] Using model: ${model}`);
          break;
        } else {
          console.warn(`[ChatStream] Model ${model} failed (${response.status}), trying next...`);
        }
      } catch (err) {
        console.warn(`[ChatStream] Model ${model} error:`, err);
      }
    }

    if (!llmResponse || !llmResponse.body) {
      res.json({ type: "error", content: "I'm having trouble connecting right now. Please try again." });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    // Send retrieval type as first event
    res.write(`data: ${JSON.stringify({ type: "meta", retrievalType: "semantic" })}\n\n`);

    let fullContent = "";

    // Parse the SSE stream from OpenAI
    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullContent += token;
            // Forward the token to the client
            res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    // Output validation on the full response
    const contentUpper = fullContent.toUpperCase();
    let shouldReplace = false;

    // Check for prompt/identity leaks
    if (LEAKED_PATTERNS.some(p => contentUpper.includes(p.toUpperCase()))) {
      shouldReplace = true;
    }

    // Check for company hallucinations — Jun ONLY worked at these companies
    const REAL_COMPANIES = ["META", "MANUS", "INSTAWORK", "HOYOVERSE", "HOYO", "TIKTOK", "BYTEDANCE", "BANK OF SINGAPORE", "DBS"];
    const HALLUCINATED_COMPANIES = [
      "SHOPEE", "GRAB", "LAZADA", "SEA GROUP", "RAZER", "GARENA",
      "GOOGLE", "AMAZON", "APPLE", "MICROSOFT", "NETFLIX", "UBER",
      "STRIPE", "AIRBNB", "SPOTIFY", "TWITTER", "SNAP",
      "BINANCE", "CRYPTO.COM", "REVOLUT", "WISE",
      "SHOPIFY", "SALESFORCE", "ORACLE", "SAP",
      "JPMORGAN", "GOLDMAN", "MORGAN STANLEY", "CITIBANK",
      "OCBC", "UOB",
    ];
    // Only flag if the response claims Jun "worked at" or "joined" a hallucinated company
    const WORK_VERBS = ["WORKED AT", "JOINED", "WAS AT", "EMPLOYED AT", "ROLE AT", "POSITION AT", "TIME AT", "STINT AT", "EXPERIENCE AT"];
    for (const company of HALLUCINATED_COMPANIES) {
      if (contentUpper.includes(company)) {
        // Check if it's in a work context (not just mentioning the company in passing)
        if (WORK_VERBS.some(verb => contentUpper.includes(verb + " " + company) || contentUpper.includes(company + "'") || contentUpper.includes("AT " + company))) {
          console.warn(`[ChatStream] Hallucination detected: claimed Jun worked at ${company}`);
          shouldReplace = true;
          break;
        }
      }
    }

    if (shouldReplace) {
      fullContent = "Jun is currently a **Senior Frontend Software Engineer at Meta (Manus AI)** in Singapore, building the core AI agent conversation interface. He has 7+ years of experience across **Meta**, **Instawork**, **HoYoverse**, **TikTok/ByteDance**, **Bank of Singapore**, and **DBS Bank**. What specific role or company would you like to know more about?";
      res.write(`data: ${JSON.stringify({ type: "replace", content: fullContent })}\n\n`);
    }

    // Signal completion (fullContent is sanitized if canary was triggered)
    res.write(`data: ${JSON.stringify({ type: "done", fullContent })}\n\n`);
    res.end();
  } catch (error) {
    console.error("[ChatStream] Error:", error);
    // If SSE headers already sent, send error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: "error", content: "Something went wrong. Please try again." })}\n\n`);
      res.end();
    } else {
      res.json({ type: "error", content: "Something went wrong. Please try again." });
    }
  }
}
