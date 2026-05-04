# askJun — Interview Presentation Script

**Purpose:** A structured script for explaining how you built askJun from scratch during a system design or portfolio walkthrough in a technical interview. Designed for a 10-15 minute presentation with natural pauses for questions.

---

## Opening (30 seconds)

> "I'd like to walk you through a project I recently built called askJun — it's a chat-first AI portfolio where recruiters and hiring managers can have a conversation with an AI agent trained on my entire career. Instead of reading a static resume, you ask it questions and it responds with context-aware answers grounded in my actual experience. You can try it live at askjun.org."

**Pause for reaction. If they ask "why did you build this?":**

> "Two reasons. First, I wanted to differentiate myself in a market where every senior engineer has a similar-looking portfolio. Second, I'd just spent months building AI agent conversation interfaces at Meta — so building one for myself was a natural way to demonstrate that skill in a 'show don't tell' manner. The portfolio *is* the portfolio piece."

---

## Architecture Overview (2-3 minutes)

> "Let me walk through the architecture. The entire application is a single Node.js process running Express 4. It serves both the React SPA frontend and the tRPC API backend from one port. There's no separate frontend server, no microservices — just one deployment unit."

**Key talking points:**

> "The frontend is React 19 with TypeScript, Tailwind CSS 4 for styling, and Framer Motion for animations. I use Wouter for client-side routing — it's a 1.5KB alternative to React Router that does everything I need. The design follows Nothing's industrial minimalism — stark monochrome with a single red accent color."

> "For the API layer, I chose tRPC 11 over REST or GraphQL. The tradeoff here is that tRPC gives me end-to-end type safety between the frontend and backend without any code generation step. Since this is a monorepo where I control both sides, the DX advantage is significant — I change a server procedure's return type and the frontend immediately gets type errors if it's consuming it wrong."

> "The AI chat is powered by DeepSeek via an OpenAI-compatible API. I inject a comprehensive system prompt with my full CV, company context, and behavioral rules. The knowledge base is about 8,000 tokens — large enough to be comprehensive but small enough to fit in the context window with room for multi-turn conversation."

**If they ask about the database:**

> "MySQL via Drizzle ORM. Three tables — users for OAuth, analytics_events for tracking every interaction, and visitors for unique visitor counting with geo-IP. I chose Drizzle over Prisma because it's lighter weight and gives me more control over the generated SQL. The schema is intentionally flat — no foreign keys, no complex relations. For a portfolio site, simplicity beats normalization."

---

## Design Decisions & Tradeoffs (3-4 minutes)

### Why a single process?

> "I deliberately chose a monolithic architecture over microservices. The tradeoff is clear: for a portfolio site with maybe 100 visitors a day, the operational complexity of separate frontend/backend deployments, API gateways, and service discovery would be pure overhead. One process means one thing to deploy, one thing to monitor, one set of logs. If this needed to scale to millions of users, I'd split it — but premature optimization is the root of all evil."

### Why tRPC over REST?

> "REST would work fine here, but tRPC eliminates an entire class of bugs — the 'I changed the API response shape but forgot to update the frontend' class. With tRPC, if I add a field to the chat response, TypeScript immediately tells me everywhere in the frontend that needs updating. The tradeoff is that tRPC is less portable — you can't easily call it from a mobile app or a third-party client. But for a monorepo SPA, that's not a concern."

### Why DeepSeek over OpenAI?

> "Cost and quality per token. DeepSeek's chat model gives me GPT-4-level responses for about 1/10th the cost. For a portfolio site where I'm paying out of pocket, that matters. The API is OpenAI-compatible, so switching to GPT-4 or Claude is literally changing one URL and one model string — maybe 30 seconds of work."

### Why client-side fallback?

> "I built a keyword-matching fallback engine that works without any API call. If DeepSeek is down, or if the user hits the rate limit, the site still responds intelligently. It's not as good as the real AI, but it covers the top 15 questions recruiters ask. The tradeoff is maintaining two response systems, but it means the site never shows a blank error state — which matters when a recruiter is evaluating you."

### Why Nothing's design language?

> "I wanted to stand out from the sea of glassmorphism and gradient portfolios. Nothing's aesthetic — stark monochrome, sharp borders, monospace typography, zero border-radius — is polarizing, which is the point. A portfolio that looks like everyone else's is invisible. The tradeoff is accessibility — very low-contrast designs can be harder to read. I mitigated this with a light/dark mode toggle and ensured all text passes WCAG AA contrast ratios."

---

## Key Technical Challenges (2-3 minutes)

### Challenge 1: Streaming vs. Simulated Streaming

> "DeepSeek supports streaming responses, but tRPC's mutation model doesn't natively support Server-Sent Events. I had two options: implement a raw Express SSE endpoint outside tRPC, or simulate streaming on the frontend. I chose simulated streaming — the server returns the full response, and the frontend types it out character by character with variable speed and pauses at punctuation. The tradeoff is slightly higher latency (you wait for the full response before seeing anything), but the UX *feels* like streaming because the typing animation starts immediately after the response arrives. And I keep the entire API within tRPC's type-safe boundary."

### Challenge 2: Knowledge Base Design

> "The system prompt is about 8,000 tokens. I had to decide: do I use RAG (retrieval-augmented generation) with embeddings, or do I just stuff everything into the system prompt? I chose prompt stuffing because my knowledge base is small enough to fit. RAG would add complexity — an embedding model, a vector database, a retrieval step — for maybe 50 facts about one person's career. The tradeoff is that if my career grows significantly, I'll eventually hit context limits. But for now, simplicity wins."

### Challenge 3: Analytics Without Third-Party Dependencies

> "I built a dual analytics system. Umami handles client-side pageviews (it's privacy-friendly and self-hostable). For deeper tracking — which questions recruiters ask, which chips they click, CV download rates — I built a custom server-side system that writes directly to MySQL. Every frontend interaction fires a non-blocking fetch to my track.event endpoint. The admin dashboard at /admin shows all this data with date range filters and a Recharts line chart. The tradeoff is that I'm maintaining my own analytics infrastructure, but it gives me exactly the data I want without sending visitor info to Google or Mixpanel."

---

## Metrics & Impact (1 minute)

> "The site is live at askjun.org. It has a password-protected admin dashboard where I can see real-time visitor data, top questions asked, CV download rates, and traffic trends over time. The AI knowledge base includes context from every company I've worked at — their revenue, scale, and how my work directly contributed to those numbers. When a recruiter asks 'Tell me about his payment systems work,' the AI doesn't just list bullet points — it contextualizes them within HoYoverse's $3.8 billion revenue and 225 million downloads."

---

## Closing (30 seconds)

> "The entire project is open source at github.com/junnyboi/askjun. It deploys in under 10 minutes on Railway or any VPS for about $5-15 a month. The architecture is deliberately simple — one process, one database, one LLM API call. I optimized for developer experience and maintainability over theoretical scalability, because for a portfolio site, the right architecture is the one you can ship fast and iterate on."

**If they ask "what would you do differently?":**

> "Three things. First, I'd implement proper streaming via WebSockets or SSE from day one — the simulated typing is a UX compromise. Second, I'd add conversation persistence so returning visitors see their previous chat history. Third, I'd implement server-side rendering for the portfolio page to improve SEO — right now it's a client-rendered SPA, which means Google has to execute JavaScript to index the content."

---

## Potential Follow-Up Questions & Answers

**Q: How do you handle rate limiting?**
> "In-memory map keyed by IP address. 30 messages per IP per hour with a sliding window. If the limit is hit, the response includes a `rateLimited: true` flag and the frontend shows a friendly message redirecting to email. The tradeoff of in-memory vs. Redis is that it resets on server restart, but for a single-instance portfolio site, that's acceptable."

**Q: How do you prevent prompt injection?**
> "The system prompt explicitly instructs the model to only discuss information from the knowledge base and to never reveal internal system details. For salary questions, it redirects to direct contact. It's not bulletproof — no prompt-based defense is — but the risk is low because the worst case is the AI says something slightly off-brand, not that it leaks sensitive data."

**Q: Why not Next.js?**
> "Next.js would give me SSR, file-based routing, and API routes out of the box. But it also brings a lot of framework opinions I don't need — server components, the app router complexity, Vercel-specific optimizations. For a project this size, Express + Vite gives me the same result with more control and fewer abstractions. The tradeoff is that I don't get automatic code splitting per route, but with only 3 pages, that's negligible."

**Q: How would you scale this to handle 10,000 concurrent users?**
> "First, I'd add Redis for rate limiting and session storage. Second, I'd put the Express server behind a load balancer with multiple instances. Third, I'd implement proper streaming via WebSockets so the LLM response doesn't block a worker thread. Fourth, I'd add a CDN layer (Cloudflare) in front for static assets and cache the portfolio page at the edge. The database would need connection pooling and possibly read replicas. But honestly, for a portfolio site, even a single $5 VPS handles hundreds of concurrent users without breaking a sweat."
