# askJun — System Architecture & Self-Hosting Guide

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SINGLE NODE PROCESS                       │
│                     (Express 4 + tRPC 11)                       │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │  Vite (dev)  │   │  Static SPA  │   │  /api/trpc/*     │    │
│  │  or          │   │  (prod)      │   │  tRPC Router     │    │
│  │  dist/public │   │  React 19    │   │                  │    │
│  └──────────────┘   └──────────────┘   └────────┬─────────┘    │
│                                                   │              │
│  ┌──────────────┐   ┌──────────────┐   ┌────────▼─────────┐    │
│  │  /api/oauth  │   │ /manus-      │   │  Business Logic  │    │
│  │  callback    │   │  storage/*   │   │  - chat.send     │    │
│  │  (Manus SSO) │   │  (S3 proxy)  │   │  - track.event   │    │
│  └──────────────┘   └──────────────┘   │  - admin.*       │    │
│                                         └────────┬─────────┘    │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────┐
                    │           EXTERNAL SERVICES                  │
                    │                                              │
                    │  ┌────────────┐  ┌──────────────────────┐   │
                    │  │ MySQL/TiDB │  │ Manus Forge API      │   │
                    │  │ (Drizzle)  │  │ - LLM (GPT-4.1-mini)     │   │
                    │  │            │  │ - S3 Storage          │   │
                    │  │ Tables:    │  │ - OAuth               │   │
                    │  │ - users    │  └──────────────────────┘   │
                    │  │ - analytics│                              │
                    │  │ - visitors │  ┌──────────────────────┐   │
                    │  └────────────┘  │ ip-api.com (geo-IP)  │   │
                    │                  └──────────────────────┘   │
                    └─────────────────────────────────────────────┘
```

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | SPA with chat interface + portfolio page |
| **Styling** | Tailwind CSS 4 + Framer Motion | Nothing design system + animations |
| **State** | TanStack React Query + tRPC hooks | Server state management |
| **Routing** | Wouter | Client-side SPA routing (/, /portfolio, /admin) |
| **Build** | Vite 7 | Dev server + production bundler |
| **Backend** | Express 4 + tRPC 11 | API server + static file serving |
| **Database** | MySQL/TiDB via Drizzle ORM | Users, analytics events, visitors |
| **LLM** | GPT-4.1-mini (via OpenAI-compatible API) | AI chat responses |
| **Auth** | Manus OAuth (JWT session cookies) | User authentication |
| **Storage** | S3 (via Manus Forge presigned URLs) | Profile photo, CV PDF, project thumbnails |
| **Analytics** | Umami (client) + custom DB tracking (server) | Dual analytics |
| **Geo-IP** | ip-api.com | Visitor country resolution |

## 3. Key Files

```
server/_core/index.ts     → Express server entry point (starts everything)
server/_core/llm.ts       → LLM API wrapper (OpenAI-compatible endpoint)
server/_core/env.ts       → Environment variable definitions
server/_core/oauth.ts     → Manus OAuth callback handler
server/_core/storageProxy.ts → S3 presigned URL proxy for /manus-storage/*
server/_core/vite.ts      → Vite dev/prod serving logic
server/routers.ts         → All tRPC procedures (chat, track, admin)
server/knowledge.ts       → System prompt + knowledge base for AI
server/db.ts              → Database connection + user helpers
drizzle/schema.ts         → Database table definitions
client/src/pages/Home.tsx → Chat-first landing page
client/src/pages/Portfolio.tsx → Portfolio showcase page
client/src/pages/Admin.tsx → Password-protected admin dashboard
```

## 4. Environment Variables Required

| Variable | Purpose | Self-Hosting Replacement |
|----------|---------|--------------------------|
| `DATABASE_URL` | MySQL connection string | Any MySQL 8+ or TiDB instance |
| `JWT_SECRET` | Session cookie signing | Generate a random 64-char string |
| `BUILT_IN_FORGE_API_URL` | LLM + Storage API base URL | Replace with OpenAI/GPT-4.1-mini API URL |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for Forge | Your OpenAI/GPT-4.1-mini API key |
| `OAUTH_SERVER_URL` | Manus OAuth backend | Remove or replace with your own auth |
| `VITE_APP_ID` | Manus OAuth app ID | Remove if removing auth |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal | Remove if removing auth |
| `OWNER_OPEN_ID` | Owner's OAuth ID (for admin role) | Hardcode your user ID |
| `PORT` | Server port (default: 3000) | Set to your preferred port |

## 5. Manual Deployment Guide (Without Manus)

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL 8+ database (or PlanetScale/TiDB)
- An OpenAI-compatible LLM API key (GPT-4.1-mini, OpenAI, etc.)
- A VPS or cloud instance (Railway, Render, Fly.io, or any Docker host)

### Step 1: Clone & Install

```bash
git clone https://github.com/junnyboi/askjun.git
cd askjun
pnpm install
```

### Step 2: Set Up Database

Create a MySQL database and get the connection URL:
```
mysql://user:password@host:3306/askjun?ssl={"rejectUnauthorized":true}
```

### Step 3: Create `.env` File

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/askjun

# Auth (can be removed if you strip OAuth)
JWT_SECRET=your-random-64-char-secret-here

# LLM — Replace Forge with direct GPT-4.1-mini/OpenAI
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-your-openai-api-key

# Optional: remove OAuth entirely for a public portfolio
# OAUTH_SERVER_URL=
# VITE_APP_ID=
# VITE_OAUTH_PORTAL_URL=
# OWNER_OPEN_ID=

# Server
PORT=3000
NODE_ENV=production
```

### Step 4: Modify LLM Configuration

In `server/_core/llm.ts`, the `resolveApiUrl()` function builds the endpoint:
```ts
const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
```

For **GPT-4.1-mini** directly:
- Set `BUILT_IN_FORGE_API_URL=https://api.openai.com`
- Set `BUILT_IN_FORGE_API_KEY=sk-your-key`
- The model is set in `invokeLLM` as `gemini-2.5-flash` — change to `gpt-4.1-mini`

In `server/routers.ts`, find the chat.send procedure and change the model:
```ts
model: "gpt-4.1-mini"  // was "gpt-4.1-mini" in the invokeLLM call
```

### Step 5: Handle Storage (Replace Manus S3 Proxy)

The site references static assets via `/manus-storage/` URLs. For self-hosting:

**Option A: Serve locally**
- Download all referenced assets and put them in `client/public/assets/`
- Replace `/manus-storage/` URLs with `/assets/` in the code

**Option B: Use your own S3 bucket**
- Replace `server/storage.ts` with direct AWS S3 SDK calls
- Replace `server/_core/storageProxy.ts` with your own presigned URL logic

**Option C: Use CDN URLs directly**
- The current `https://d2xsxph8kpxj0f.cloudfront.net/...` URLs will continue to work as long as the Manus project exists

### Step 6: Remove OAuth (Optional)

If you want a fully public site without login:
1. Remove `registerOAuthRoutes(app)` from `server/_core/index.ts`
2. Remove the `auth` router from `server/routers.ts`
3. Remove `useAuth` imports from any pages that use them
4. The site already works without auth for all public-facing features

### Step 7: Run Database Migrations

```bash
pnpm db:push
```

### Step 8: Build & Start

```bash
# Build the frontend + bundle the backend
pnpm build

# Start production server
pnpm start
```

The server will start on the configured `PORT` and serve both the SPA and API.

### Step 9: Deploy

**Railway/Render:**
```bash
# Just push to GitHub and connect the repo
# Set environment variables in the dashboard
# Build command: pnpm install && pnpm build
# Start command: pnpm start
```

**Docker:**
```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Fly.io:**
```bash
fly launch
fly secrets set DATABASE_URL=... BUILT_IN_FORGE_API_KEY=... JWT_SECRET=...
fly deploy
```

## 6. Manus-Specific Dependencies (What to Replace)

| Dependency | What It Does | Self-Hosting Alternative |
|-----------|-------------|--------------------------|
| Forge LLM API | Proxies to GPT-4.1-mini/GPT | Call GPT-4.1-mini API directly |
| Forge Storage | S3 presigned URLs | Use AWS S3 SDK or Cloudflare R2 |
| Manus OAuth | User authentication | Remove entirely (public site) or use Auth.js |
| Manus Analytics (Umami) | Client-side pageviews | Self-host Umami or remove the script tag |
| CloudFront CDN | Static asset delivery | Assets will keep working via existing URLs |

## 7. Data Flow: Chat Message

```
User types message → Frontend sends tRPC mutation (chat.send)
  → Server checks rate limit (30 msgs/IP/hour)
  → Server calls invokeLLM() with system prompt + user messages
    → HTTP POST to GPT-4.1-mini API (OpenAI-compatible)
    → Returns AI response
  → Server also fires analytics tracking (DB insert)
  → Response returned to frontend
  → Frontend renders with Streamdown (markdown)
  → Follow-up chips generated based on topic
```

## 8. Build Output Structure

After `pnpm build`:
```
dist/
  index.js          → Bundled Express server (esbuild)
  public/
    index.html      → SPA entry point
    assets/         → Vite-bundled JS/CSS chunks
```

The production server (`node dist/index.js`) serves both the API and the static frontend from a single process.
