# askJun Full-Stack AI Backend — Implementation Plan

**Date:** April 30, 2026
**Objective:** Upgrade askJun from a static client-side keyword-matching chat to a real AI-powered conversation engine with streaming responses, rate limiting, and knowledge base grounding.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client (React + TypeScript)                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ChatPanel.tsx                                    │  │
│  │  - Sends user message to /api/chat               │  │
│  │  - Receives SSE stream (text/event-stream)       │  │
│  │  - Renders markdown via Streamdown               │  │
│  │  - Shows tool-use animations for doc retrieval   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ POST /api/chat
┌─────────────────────────────────────────────────────────┐
│  Backend (Express + TypeScript)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  server/routes/chat.ts                            │  │
│  │  1. Rate limit check (IP-based, 20 msgs/hr)      │  │
│  │  2. Inject system prompt + knowledge base         │  │
│  │  3. Call LLM API (Forge built-in)                 │  │
│  │  4. Stream response back via SSE                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  server/knowledge/                                │  │
│  │  - systemPrompt.ts (persona + instructions)       │  │
│  │  - knowledgeBase.ts (compiled CV + Q&A data)      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Rate Limiter (in-memory or DB-backed)            │  │
│  │  - 20 messages per IP per hour                    │  │
│  │  - Graceful error message when exceeded           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ BUILT_IN_FORGE_API
┌─────────────────────────────────────────────────────────┐
│  LLM Provider (Manus Forge API)                         │
│  - Already injected as env: BUILT_IN_FORGE_API_KEY      │
│  - Endpoint: BUILT_IN_FORGE_API_URL                     │
│  - Supports streaming (SSE)                             │
│  - Model: claude-3.5-sonnet or gpt-4o equivalent        │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Upgrade to Full-Stack (`web-db-user`)

**Action:** Run `webdev_add_feature` with `feature: "web-db-user"`

This unlocks:
- Backend Express server with API routes
- Database (for rate limiting persistence + conversation history)
- LLM access via `BUILT_IN_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL`
- Server-side environment variables

**Estimated time:** 5 minutes (scaffold + dependency install)

---

## Phase 2: Build the Knowledge Base

Create structured knowledge files that get injected into the system prompt:

### `server/knowledge/systemPrompt.ts`

```typescript
export const SYSTEM_PROMPT = `You are Jun's AI portfolio assistant. You represent Boh Ze Jun, 
a Senior Frontend / Full Stack Software Engineer based in Singapore.

PERSONALITY:
- Professional yet conversational and warm
- Confident but not arrogant
- Technically precise when discussing engineering topics
- Enthusiastic about AI and building great products

RULES:
1. Only discuss information from the KNOWLEDGE BASE below
2. Never fabricate achievements, metrics, or experiences
3. For salary/compensation questions, redirect to direct contact
4. Keep responses concise (2-4 paragraphs max) unless detail is requested
5. Use markdown formatting: **bold** for emphasis, bullet lists for details
6. When asked for resume/CV, indicate it can be downloaded from the site

KNOWLEDGE BASE:
{knowledgeBase}`;
```

### `server/knowledge/knowledgeBase.ts`

Compile all CV data, Q&A pairs, and professional context into a single string (~3000 tokens). This includes:
- Full work experience with bullet points
- Technical skills and domain expertise  
- Education and awards
- Pre-crafted answers for sensitive questions (why leaving, salary, availability)
- Project deep-dives (HoYoverse $57M launch, TikTok GDPR, Manus AI agent UI)

---

## Phase 3: Build the Chat API Route

### `server/routes/chat.ts`

```typescript
import { Router } from "express";

const router = Router();

// In-memory rate limiter (upgrade to DB for persistence)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

router.post("/api/chat", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  
  // 1. Rate limit check
  const now = Date.now();
  const limit = rateLimits.get(ip);
  if (limit && limit.resetAt > now && limit.count >= 20) {
    return res.status(429).json({ 
      error: "Rate limit exceeded. Please try again later." 
    });
  }
  
  // Update rate limit counter
  if (!limit || limit.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 3600000 });
  } else {
    limit.count++;
  }

  // 2. Extract message from request
  const { messages } = req.body; // Array of { role, content }
  
  // 3. Build full prompt with system message + knowledge base
  const fullMessages = [
    { role: "system", content: buildSystemPrompt() },
    ...messages.slice(-10), // Keep last 10 messages for context
  ];

  // 4. Call Forge API with streaming
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  
  const response = await fetch(`${forgeUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${forgeKey}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      messages: fullMessages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  // 5. Stream response back to client
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Pipe the SSE stream from Forge to the client
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value));
  }
  
  res.end();
});

export default router;
```

---

## Phase 4: Update the Frontend Chat Component

Modify `ChatPanel.tsx` to:

1. **Replace the local `chatEngine.ts`** keyword matcher with real API calls
2. **Send conversation history** (last 10 messages) for context
3. **Parse SSE stream** and render tokens as they arrive
4. **Handle errors gracefully** (rate limit, network, API failures)
5. **Keep the tool-use animation** for resume/document requests (detect via response content)

### Key Frontend Changes:

```typescript
// New hook: useChat.ts
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string) => {
    // Add user message
    const userMsg = { role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // Call API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages }),
    });

    // Stream response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      // Parse SSE data lines
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const data = JSON.parse(line.slice(6));
        if (data.choices?.[0]?.delta?.content) {
          assistantContent += data.choices[0].delta.content;
          // Update UI with partial content
          setMessages([...updatedMessages, { role: "assistant", content: assistantContent }]);
        }
      }
    }

    setIsStreaming(false);
  };

  return { messages, sendMessage, isStreaming };
}
```

---

## Phase 5: Security & Polish

| Concern | Solution |
|---------|----------|
| Rate limiting | 20 messages/IP/hour (in-memory, upgrade to DB) |
| Prompt injection | System prompt instructs model to stay on-topic; input sanitization |
| Token abuse | Max 1024 output tokens per response |
| Context window | Only send last 10 messages (prevents token overflow) |
| Error handling | Graceful fallback to client-side engine if API fails |
| Cost control | Rate limiting + max_tokens cap |

---

## Phase 6: Fallback Strategy

If the Forge API is unavailable or rate-limited, the frontend **falls back to the existing client-side keyword engine** (`chatEngine.ts`). This ensures the portfolio always works, even without backend connectivity.

```typescript
try {
  const response = await fetch("/api/chat", { ... });
  if (!response.ok) throw new Error("API unavailable");
  // Stream response...
} catch (error) {
  // Fallback to local engine
  const localResponse = getResponse(query);
  // Display with simulated streaming...
}
```

---

## Execution Timeline

| Step | Action | Time |
|------|--------|------|
| 1 | Run `webdev_add_feature("web-db-user")` | 5 min |
| 2 | Create knowledge base files | 15 min |
| 3 | Build `/api/chat` route with streaming | 20 min |
| 4 | Update `ChatPanel.tsx` with real API calls | 15 min |
| 5 | Add rate limiting + error handling | 10 min |
| 6 | Test end-to-end with various queries | 10 min |
| **Total** | | **~75 min** |

---

## Environment Variables Required

All already available via the `web-db-user` upgrade:
- `BUILT_IN_FORGE_API_KEY` — LLM API authentication
- `BUILT_IN_FORGE_API_URL` — LLM API endpoint
- `JWT_SECRET` — For optional user session tracking
- Database connection — For persistent rate limiting

---

## Decision Points for You

1. **Model choice:** Claude Sonnet 4 (recommended for natural conversation) vs GPT-4o (faster, slightly less nuanced)
2. **Rate limit:** 20 msgs/hour/IP seems reasonable — want to adjust?
3. **Conversation persistence:** Store chat history in DB so returning visitors see their previous conversation? (Nice-to-have, adds complexity)
4. **Authentication:** Currently open to all visitors. Want to add optional Manus OAuth so you can see who's chatting?

---

*Ready to execute when you give the word, Adventurer.*
