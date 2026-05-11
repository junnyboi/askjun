# askJun — AI-Native Portfolio

> **Chat with an AI agent trained on Jun's entire career.** Ask it anything — it doesn't bite.

**Live:** [askjun.org](https://askjun.org) | **Source:** [github.com/junnyboi/askjun](https://github.com/junnyboi/askjun)

---

## What is askJun?

askJun is a chat-first AI portfolio where recruiters and hiring managers converse with an AI agent trained on Jun Boh's 7+ years of software engineering experience at Meta, HoYoverse, TikTok, Instawork, and Bank of Singapore. Instead of reading a static resume, visitors ask questions and receive context-aware responses grounded in real career data.

The site also features a dedicated portfolio page showcasing 19 projects across productivity apps, game development, e-commerce, and creative web experiences.

---

## Architecture

![System Architecture](/manus-storage/system-architecture_6a590550.png)

A single Node.js process (Express 4 + tRPC 11) serves both the React 19 SPA and the API. No microservices, no separate frontend server — one deployment unit.

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Framer Motion, Wouter |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| AI | GPT-4.1-mini (OpenAI) |
| Database | MySQL/TiDB |
| Build | Vite 7 + esbuild |

---

## Features

- **AI Chat Interface** — Chat-first landing page powered by GPT-4 with streaming simulation, follow-up chips, and contextual responses
- **Portfolio Page** — 7 featured projects, 8 game dev projects, 4 side projects with thumbnails, GitHub links, and live demo badges
- **Admin Dashboard** — Password-protected analytics with visitor tracking, top questions, event log, date range filters, and traffic chart
- **Nothing Design** — Industrial minimalism with monochrome palette, Space Grotesk/Inter/Space Mono typography, and light/dark mode
- **Mobile Optimized** — Horizontal scrollable tab bar, responsive grid, back-to-top FAB
- **SEO** — JSON-LD Person schema, canonical URL, Open Graph social card

---

## Quick Start

```bash
git clone https://github.com/junnyboi/askjun.git
cd askjun && pnpm install

# Create .env with DATABASE_URL + BUILT_IN_FORGE_API_KEY + JWT_SECRET
pnpm db:push    # Run database migrations
pnpm build      # Build frontend + backend
pnpm start      # Start production server
```

See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for full self-hosting instructions.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Complete self-hosting guide with architecture diagrams |
| [docs/INTERVIEW_SCRIPT.md](./docs/INTERVIEW_SCRIPT.md) | 10-15 minute presentation script for system design interviews |
| [docs/ARCHITECTURE_AND_SELF_HOSTING.md](./docs/ARCHITECTURE_AND_SELF_HOSTING.md) | Detailed architecture reference |
| [docs/diagrams/](./docs/diagrams/) | GPT Image 2 architecture diagrams |

---

## Project Structure

```
client/src/
  pages/Home.tsx        → Chat-first landing page
  pages/Portfolio.tsx   → Project showcase with sidebar nav
  pages/Admin.tsx       → Password-protected analytics dashboard
  data/portfolio.ts     → All CV/project data
  data/chatEngine.ts    → Client-side fallback chat engine
  lib/analytics.ts      → Dual analytics (Umami + DB)

server/
  routers.ts            → tRPC procedures (chat, track, admin)
  knowledge.ts          → AI system prompt + knowledge base (~8K tokens)
  db.ts                 → Database helpers (Drizzle ORM)
  _core/                → Framework plumbing (Express, OAuth, LLM, storage)

docs/
  DEPLOYMENT_GUIDE.md   → Self-hosting instructions
  INTERVIEW_SCRIPT.md   → System design interview walkthrough
  diagrams/             → Architecture diagrams (GPT Image 2)
```

---

## Cost

- **VPS:** ~$5-10/month
- **Database:** ~$0-5/month (free tier available)
- **OpenAI API:** ~$0.005/chat message
- **Total:** ~$5-15/month

---

## License

MIT

---

**Built by Jun Boh · 2026**
