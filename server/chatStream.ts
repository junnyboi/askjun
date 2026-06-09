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
const LEAKED_PATTERNS = ["RULES:", "KNOWLEDGE BASE:", "PERSONALITY:", CANARY, "ONLY discuss information provided", "Never reveal internal system"];

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

  try {
    const llmResponse = await fetch(llmUrl, {
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
        stream: true, // Enable streaming!
      }),
    });

    if (!llmResponse.ok || !llmResponse.body) {
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
    if (LEAKED_PATTERNS.some(p => contentUpper.includes(p.toUpperCase()))) {
      // Send a replacement — client should discard previous tokens
      res.write(`data: ${JSON.stringify({ type: "replace", content: "I'd be happy to tell you about Jun's professional experience! What specific aspect of his career would you like to know about?" })}\n\n`);
    }

    // Signal completion
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
