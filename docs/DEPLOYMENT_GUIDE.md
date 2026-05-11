# askJun — Self-Hosting Deployment Guide

**Author:** Jun Boh
**Last Updated:** May 2026

This document provides a complete guide for deploying askJun from source code without Manus, covering both the system architecture and step-by-step deployment instructions.

---

## System Architecture

askJun is a **single-process full-stack application** that serves both the React SPA frontend and the Express API backend from one Node.js process on one port. There are no microservices, no separate frontend server, and no API gateway — just one deployment unit.

![System Architecture](/manus-storage/system-architecture_6a590550.png)

The architecture consists of three layers. The **client layer** is a React 19 SPA with three pages (Chat Interface, Portfolio, Admin Dashboard) that communicates with the server exclusively through tRPC over HTTP. The **server layer** is a single Express 4 process that handles tRPC API routes, OAuth callbacks, S3 storage proxying, and static SPA serving. The **external services layer** includes MySQL/TiDB for persistence, GPT-4.1-mini for LLM inference, S3/CloudFront for static assets, and ip-api.com for geo-IP resolution.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | SPA with chat interface + portfolio page |
| Styling | Tailwind CSS 4 + Framer Motion | Nothing design system + animations |
| State | TanStack React Query + tRPC hooks | Server state management |
| Routing | Wouter | Client-side SPA routing (/, /portfolio, /admin) |
| Build | Vite 7 + esbuild | Dev server + production bundler |
| Backend | Express 4 + tRPC 11 | API server + static file serving |
| Database | MySQL/TiDB via Drizzle ORM | Users, analytics events, visitors |
| LLM | GPT-4.1-mini (OpenAI-compatible API) | AI chat responses |
| Analytics | Custom DB (server-side) | Event tracking via tRPC |

---

## Chat Message Data Flow

![Chat Message Flow](/manus-storage/chat-message-flow_e5066f90.png)

When a user sends a message, the flow is as follows. The frontend sends a tRPC mutation (`chat.send`) containing the message array. The server checks the rate limit (30 messages per IP per hour). If within limits, the server injects the system prompt (~8,000 tokens of career knowledge), the conversation history, and sends an HTTP POST to the GPT-4.1-mini API. The response is returned to the frontend, which renders it with Streamdown (markdown) and displays contextual follow-up suggestion chips. Asynchronously, the server stores an analytics event in MySQL and upserts the visitor record with geo-IP country data from ip-api.com.

---

## Manus Dependencies to Replace

Only three Manus-specific integrations require replacement for self-hosting:

| Manus Dependency | What It Does | Self-Hosting Replacement |
|-----------------|-------------|--------------------------|
| Forge LLM API | Proxies to OpenAI | Call OpenAI API directly (GPT-4.1-mini) |
| Forge Storage | S3 presigned URL proxy | Use AWS S3 SDK directly or keep existing CDN URLs |
| Manus OAuth | User authentication | Remove entirely (site works without auth) |

The existing CloudFront CDN URLs for images will continue working indefinitely. Umami analytics can be self-hosted or removed by deleting the script tag from `index.html`.

---

## Deployment Options

![Deployment Options](/manus-storage/deployment-options_258f2ad4.png)

### Option A: Single VPS ($5-10/month)

This is the simplest approach — a single server running everything.

**Prerequisites:** Any VPS with Node.js 22+ (DigitalOcean, Hetzner, Linode, or Vultr).

```bash
# 1. Clone and install
git clone https://github.com/junnyboi/askjun.git
cd askjun && pnpm install

# 2. Create .env file
cat > .env << 'EOF'
SUPABASE_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
LLM_API_URL=https://api.openai.com
LLM_API_KEY=sk-proj-your-openai-key
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
EOF

# 3. Run database migrations
pnpm db:push

# 4. Build the application
pnpm build

# 5. Start with PM2 for auto-restart
pm2 start dist/index.js --name askjun

# 6. Set up Caddy for auto-SSL
# Caddyfile:
# askjun.org {
#     reverse_proxy localhost:3000
# }
```

**Total cost:** ~$5/month (VPS) + $0 (Supabase free tier) + ~$0.005/chat (OpenAI GPT-4.1-mini).

### Option B: Container Platform ($5-15/month, Zero Ops)

For a fully managed deployment with no server maintenance.

**Railway:**
1. Connect your GitHub repo (`junnyboi/askjun`)
2. Set environment variables in the dashboard
3. Railway auto-detects the build command (`pnpm install && pnpm build`) and start command (`node dist/index.js`)
4. Add a custom domain via CNAME record

**Fly.io:**
```bash
fly launch
fly secrets set DATABASE_URL=... BUILT_IN_FORGE_API_KEY=... JWT_SECRET=...
fly deploy
```

**Docker:**
```dockerfile
FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## Environment Variables Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|--------|
| `LLM_API_KEY` | Yes* | OpenAI API key | `sk-proj-abc123...` |
| `LLM_API_URL` | No | LLM API base URL (default: `https://api.openai.com`) | `https://api.openai.com` |
| `SUPABASE_DATABASE_URL` | Yes* | Supabase Postgres connection | `postgresql://postgres.[ref]:...` |
| `DATABASE_URL` | Fallback | MySQL connection (Manus fallback) | `mysql://user:pass@host:3306/askjun` |
| `JWT_SECRET` | Yes | Session cookie signing | `openssl rand -hex 32` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `production` |

\* Either `LLM_API_KEY` or `BUILT_IN_FORGE_API_KEY` must be set. Either `SUPABASE_DATABASE_URL` or `DATABASE_URL` must be set.

**Fallback chain:** `LLM_API_KEY` → `BUILT_IN_FORGE_API_KEY`. `SUPABASE_DATABASE_URL` → `DATABASE_URL`.

---

## LLM Configuration

The LLM uses an OpenAI-compatible API format. The endpoint is constructed as:

```
${LLM_API_URL}/v1/chat/completions
```

The model is `gpt-4.1-mini` (configured in `server/routers.ts`). The architecture is provider-agnostic — switching to Claude, Llama, or any OpenAI-compatible model requires only changing `LLM_API_URL` and the model string.

---

## Database Schema

Three tables power the entire application:

```sql
-- Users (OAuth identity)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);

-- Analytics events (every interaction)
CREATE TABLE analytics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(64) NOT NULL,
  data TEXT,
  ip VARCHAR(64),
  country VARCHAR(64),
  userAgent TEXT,
  sessionId VARCHAR(64),
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Visitors (unique visitor tracking)
CREATE TABLE visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  country VARCHAR(64),
  userAgent TEXT,
  visitCount INT DEFAULT 1,
  firstVisit TIMESTAMP DEFAULT NOW(),
  lastVisit TIMESTAMP DEFAULT NOW()
);
```

Migrations are managed via Drizzle ORM. Run `pnpm db:push` to apply schema changes.

---

## Build Output

After `pnpm build`, the output structure is:

```
dist/
  index.js          → Bundled Express server (esbuild)
  public/
    index.html      → SPA entry point
    assets/         → Vite-bundled JS/CSS chunks
    thumbnails/     → Optimized project thumbnails (WebP)
    profile-*.webp  → Profile photo variants
```

The production server (`node dist/index.js`) serves both the API and the static frontend from a single process on the configured PORT.

---

## Post-Deployment Checklist

1. Verify the site loads at your domain
2. Test the AI chat by asking a question
3. Check the admin dashboard at `/admin` (password: configured in code)
4. Verify CV download works
5. Test the portfolio page navigation
6. Confirm analytics events are being stored (check `/admin`)
