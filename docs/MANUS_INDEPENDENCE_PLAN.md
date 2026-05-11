# askJun — Full Manus Independence Implementation Plan

**Objective:** Remove all dependencies on Manus systems (CDN, Auth, Database hosting, Storage proxy, Analytics, Forge API, Vite plugins, debug collectors) so that askJun can run as a fully self-contained application on any infrastructure.

**Audit Date:** May 2026
**Total Manus references found:** 134 across 30 files

---

## Dependency Inventory

The audit identified **7 distinct Manus dependencies** across the codebase:

| # | Dependency | Files Affected | Severity | Effort |
|---|-----------|---------------|----------|--------|
| 1 | **Forge LLM API** (DeepSeek proxy) | `server/_core/llm.ts`, `server/routers.ts` | Critical — chat won't work without it | Low |
| 2 | **Forge Storage** (S3 presigned URL proxy) | `server/storage.ts`, `server/_core/storageProxy.ts`, 8 frontend files | Critical — CV download + assets break | Medium |
| 3 | **Manus OAuth** (user authentication) | `server/_core/oauth.ts`, `server/_core/sdk.ts`, `server/_core/context.ts`, `client/src/const.ts`, `client/src/main.tsx`, `client/src/_core/hooks/useAuth.ts` | Low — site works without auth | Medium |
| 4 | **Manus CDN** (CloudFront image URLs) | `client/index.html` (OG image), `client/src/pages/Portfolio.tsx` (removed already) | Low — only OG image remains | Low |
| 5 | **Manus Analytics** (Umami hosted instance) | `client/index.html` (script tag) | Low — optional feature | Low |
| 6 | **Manus Vite Plugins** (runtime + debug collector) | `vite.config.ts`, `package.json`, `client/public/__manus__/` | Medium — build breaks without them | Medium |
| 7 | **Manus-hosted Database** (TiDB via DATABASE_URL) | `server/db.ts`, `drizzle.config.ts` | Critical — all data stored here | Low (just change URL) |

---

## Phase 1: LLM API Independence (Critical, ~15 min)

**Current state:** The `invokeLLM()` function in `server/_core/llm.ts` calls `${BUILT_IN_FORGE_API_URL}/v1/chat/completions` with `BUILT_IN_FORGE_API_KEY` as the Bearer token. This is already an OpenAI-compatible endpoint — Forge just proxies to DeepSeek.

**Changes required:**

| File | Change |
|------|--------|
| `server/_core/env.ts` | Rename `forgeApiUrl` → `llmApiUrl`, `forgeApiKey` → `llmApiKey`. Add fallback to `https://api.deepseek.com` |
| `server/_core/llm.ts` | Update `resolveApiUrl()` to use the new env names. Remove the `forge.manus.im` fallback URL |
| `.env` | Change `BUILT_IN_FORGE_API_URL` → `LLM_API_URL=https://api.deepseek.com` and `BUILT_IN_FORGE_API_KEY` → `LLM_API_KEY=sk-your-key` |

**Alternative LLM providers (drop-in replacements):**
- DeepSeek: `https://api.deepseek.com` (cheapest, current choice)
- OpenAI: `https://api.openai.com` (most reliable)
- Anthropic via OpenRouter: `https://openrouter.ai/api` (Claude access)
- Self-hosted Ollama: `http://localhost:11434` (free, local)

---

## Phase 2: Storage Independence (Critical, ~1 hour)

**Current state:** The `/manus-storage/*` route in `storageProxy.ts` intercepts requests, calls Forge for a presigned S3 GET URL, and 307-redirects the browser. The `storage.ts` helper uploads via Forge presigned PUT URLs. Currently, 2 assets are served this way: the CV PDF and the profile photo (though profile photo was already moved to `client/public/`).

**Changes required:**

| File | Change |
|------|--------|
| `server/_core/storageProxy.ts` | **Option A:** Replace with a static file server pointing to a local `storage/` directory. **Option B:** Replace with direct S3 SDK calls using your own bucket. |
| `server/storage.ts` | Replace Forge presigned URL logic with direct AWS S3 SDK (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) or local filesystem writes |
| `client/src/pages/Home.tsx` | Replace `/manus-storage/JunBoh-CV-2026_adffff38.pdf` with `/assets/JunBoh-CV-2026.pdf` (local) or S3 URL |
| `client/src/pages/Portfolio.tsx` | Same — update CV download link |
| `client/src/components/nothing/HeroSection.tsx` | Update CV link |
| `client/src/components/HeroCard.tsx` | Update profile photo reference (already using `/profile-thumb.webp` on main pages) |

**Recommended approach:** Move the CV PDF to `client/public/assets/JunBoh-CV-2026.pdf` and serve it statically. No S3 needed for a single PDF. For future file uploads (if needed), use Cloudflare R2 (S3-compatible, generous free tier).

**Environment variables to add:**
```env
# Only if using S3 for future uploads:
S3_BUCKET=askjun-assets
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://s3.ap-southeast-1.amazonaws.com  # or R2 endpoint
```

---

## Phase 3: OAuth Removal (Low priority, ~30 min)

**Current state:** Manus OAuth handles user login via `/api/oauth/callback`. The `sdk.ts` file contains the full OAuth client. The `context.ts` builds tRPC context by authenticating requests. The frontend has `useAuth()` hook, `getLoginUrl()`, and unauthorized-redirect logic in `main.tsx`.

**Since askJun is a public portfolio with no user-specific features, OAuth can be completely removed.**

**Changes required:**

| File | Action |
|------|--------|
| `server/_core/oauth.ts` | Delete entirely |
| `server/_core/sdk.ts` | Delete entirely |
| `server/_core/types/manusTypes.ts` | Delete entirely |
| `server/_core/context.ts` | Simplify — remove `sdk.authenticateRequest()`, always set `user: null` |
| `server/_core/index.ts` | Remove `registerOAuthRoutes(app)` import and call |
| `client/src/const.ts` | Remove `getLoginUrl()` function |
| `client/src/main.tsx` | Remove `redirectToLoginIfUnauthorized` logic, `UNAUTHED_ERR_MSG` import, and error subscribers |
| `client/src/_core/hooks/useAuth.ts` | Simplify to always return `{ user: null, isAuthenticated: false }` or delete |
| `client/src/components/ManusDialog.tsx` | Delete entirely (unused) |
| `server/routers.ts` | Remove `auth` router (logout mutation) |
| `shared/const.ts` | Remove `UNAUTHED_ERR_MSG` and `NOT_ADMIN_ERR_MSG` |

**Environment variables to remove:** `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`

---

## Phase 4: CDN Independence (Low priority, ~15 min)

**Current state:** The OG image in `client/index.html` references `https://d2xsxph8kpxj0f.cloudfront.net/...`. This is the only remaining CDN dependency — all project thumbnails were already moved to `client/public/thumbnails/`.

**Changes required:**

| File | Change |
|------|--------|
| `client/index.html` | Move OG image to `client/public/og-image.png` and update the meta tag to use a relative or absolute URL on your own domain: `https://askjun.org/og-image.png` |

**Steps:**
1. Download the OG image from the CDN URL
2. Save to `client/public/og-image.png`
3. Update `og:image` and `twitter:image` meta tags to `https://askjun.org/og-image.png`

---

## Phase 5: Analytics Independence (Low priority, ~10 min)

**Current state:** Umami analytics script in `index.html` uses `%VITE_ANALYTICS_ENDPOINT%/umami` and `%VITE_ANALYTICS_WEBSITE_ID%`. These are Manus-hosted Umami instances.

**Options:**

| Option | Effort | Cost |
|--------|--------|------|
| **Self-host Umami** | Medium (Docker deploy) | Free (same VPS) |
| **Use Plausible Cloud** | Low (script tag swap) | $9/month |
| **Remove entirely** | Zero | Free — custom DB analytics still works |
| **Keep custom DB analytics only** | Zero | Free — already built |

**Recommended:** Remove the Umami script tag entirely. The custom server-side analytics (`track.event` → MySQL) already captures everything you need (CV downloads, chat messages, chip clicks, page views). The admin dashboard at `/admin` displays all this data.

**Changes:**

| File | Change |
|------|--------|
| `client/index.html` | Remove the `<script>` tag referencing Umami |
| `client/src/lib/analytics.ts` | Remove the `umami.track()` calls (keep the tRPC `track.event` calls) |

**Environment variables to remove:** `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`

---

## Phase 6: Vite Plugin Independence (Medium priority, ~30 min)

**Current state:** `vite.config.ts` imports two Manus-specific plugins:
1. `vite-plugin-manus-runtime` — injects runtime helpers for the Manus hosting environment
2. `vitePluginManusDebugCollector` — collects browser logs and writes to `.manus-logs/`

The config also has Manus-specific domain allowlists for CORS.

**Changes required:**

| File | Change |
|------|--------|
| `vite.config.ts` | Remove `vitePluginManusRuntime()` and `vitePluginManusDebugCollector()` from plugins array. Remove Manus domain allowlist from server config. Remove `.manus-logs` directory references. |
| `package.json` | Remove `"vite-plugin-manus-runtime": "^0.0.57"` from devDependencies |
| `client/public/__manus__/` | Delete the entire directory (`debug-collector.js`, `version.json`) |

**CORS replacement:** Add your own domain(s) to the allowlist:
```ts
server: {
  cors: {
    origin: ["https://askjun.org", "http://localhost:3000"]
  }
}
```

---

## Phase 7: Database — Supabase Primary with Manus TiDB Fallback (~2 hours)

**Current state:** The app connects to a Manus-hosted TiDB (MySQL-compatible) instance via `DATABASE_URL`. The schema uses `drizzle-orm/mysql-core` with MySQL-specific types.

**Target state:** Dual-database support — prefer Supabase (PostgreSQL) via `SUPABASE_DATABASE_URL`, fall back to Manus TiDB via `DATABASE_URL` when deployed on Manus.

**Architecture:**
```
SUPABASE_DATABASE_URL set? → Use Postgres (drizzle-orm/postgres-js)
DATABASE_URL set?          → Use MySQL/TiDB (drizzle-orm/mysql2) [Manus fallback]
Neither set?               → DB disabled, site runs with client-side fallback only
```

This is the same pattern as the LLM fallback: own infrastructure first, Manus as backup.

### 7.1 Install Postgres dependencies (keep mysql2 for fallback)

```bash
pnpm add postgres
# DO NOT remove mysql2 — it's the Manus fallback
```

### 7.2 Rewrite `drizzle/schema.ts` (MySQL → Postgres)

| MySQL (current) | PostgreSQL (target) |
|----------------|--------------------|
| `import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"` | `import { pgTable, serial, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core"` |
| `mysqlTable("users", {...})` | `pgTable("users", {...})` |
| `int("id").autoincrement().primaryKey()` | `serial("id").primaryKey()` |
| `mysqlEnum("role", ["user", "admin"])` | `pgEnum("role", ["user", "admin"])` then use the enum |
| `timestamp("updatedAt").defaultNow().onUpdateNow()` | `timestamp("updatedAt").defaultNow()` (no `onUpdateNow` in PG — use a trigger or app-level update) |
| `int("visitCount")` | `integer("visitCount")` |

**New `drizzle/schema.ts`:**
```ts
import { pgTable, pgEnum, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 64 }).notNull(),
  data: text("data"),
  ip: varchar("ip", { length: 64 }),
  country: varchar("country", { length: 64 }),
  userAgent: text("userAgent"),
  sessionId: varchar("sessionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull(),
  country: varchar("country", { length: 64 }),
  userAgent: text("userAgent"),
  visitCount: integer("visitCount").default(1).notNull(),
  firstVisit: timestamp("firstVisit").defaultNow().notNull(),
  lastVisit: timestamp("lastVisit").defaultNow().notNull(),
});
```

### 7.3 Rewrite `server/db.ts` (dual-driver: Postgres primary, MySQL fallback)

```ts
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import postgres from "postgres";

let _db: any = null;
let _dbDialect: "postgres" | "mysql" | null = null;

export async function getDb() {
  if (_db) return _db;

  // Priority 1: Supabase (Postgres)
  if (process.env.SUPABASE_DATABASE_URL) {
    try {
      const client = postgres(process.env.SUPABASE_DATABASE_URL);
      _db = drizzlePg(client);
      _dbDialect = "postgres";
      console.log("[Database] Connected to Supabase (Postgres)");
      return _db;
    } catch (error) {
      console.warn("[Database] Supabase connection failed, trying fallback:", error);
    }
  }

  // Priority 2: Manus TiDB / any MySQL (fallback)
  if (process.env.DATABASE_URL) {
    try {
      _db = drizzleMysql(process.env.DATABASE_URL);
      _dbDialect = "mysql";
      console.log("[Database] Connected to MySQL/TiDB (fallback)");
      return _db;
    } catch (error) {
      console.warn("[Database] MySQL connection failed:", error);
    }
  }

  console.warn("[Database] No database configured — analytics disabled");
  return null;
}

export function getDbDialect() { return _dbDialect; }
```

**Note:** The Drizzle query API is dialect-agnostic for basic operations (select, insert, update, where, orderBy). The only MySQL-specific syntax is `onDuplicateKeyUpdate` which becomes `onConflictDoUpdate` in Postgres. The `server/routers.ts` uses manual SELECT+UPDATE patterns for visitors, which work identically in both dialects.

### 7.4 Update `drizzle.config.ts` (use Supabase when available)

```ts
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const dialect = process.env.SUPABASE_DATABASE_URL ? "postgresql" : "mysql";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect,
  dbCredentials: {
    url: connectionString,
  },
});
```

### 7.5 Fix MySQL-specific SQL in `server/routers.ts`

The `dailyTraffic` query uses `DATE()` which works in both MySQL and Postgres. The `onDuplicateKeyUpdate` in `db.ts` is MySQL-specific and must be replaced with Postgres `onConflictDoUpdate`:

```ts
// MySQL (current)
await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });

// PostgreSQL (target)
await db.insert(users).values(values).onConflictDoUpdate({
  target: users.openId,
  set: updateSet,
});
```

The `visitors` upsert uses a manual SELECT + UPDATE/INSERT pattern which is dialect-agnostic and needs no change.

### 7.6 Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create project
2. Copy the connection string from Settings → Database → Connection string (URI)
3. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. Set `DATABASE_URL` in `.env`
5. Clear old migrations: `rm -rf drizzle/migrations/ drizzle/meta/`
6. Run `pnpm db:push` to create tables in Supabase

### 7.7 Data Migration (if preserving existing analytics)

Since the existing data is just analytics (not critical user data), you have two options:
- **Fresh start:** Skip migration, tables will be empty (recommended for a clean slate)
- **Migrate data:** Export from TiDB as CSV, import into Supabase via the Table Editor or `psql \copy`

### 7.8 Optional: Use Supabase Storage for CV PDF

Instead of serving the CV from `client/public/`, you could upload it to Supabase Storage and serve via their CDN. This is optional since local serving works fine for a single PDF.

```ts
// Example: Upload CV to Supabase Storage
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await supabase.storage.from('assets').upload('JunBoh-CV-2026.pdf', fileBuffer);
```

---

## Phase 8: Unused Manus Modules Cleanup (~15 min)

Several `server/_core/` files are Manus utilities that askJun doesn't actually use:

| File | Used? | Action |
|------|-------|--------|
| `server/_core/dataApi.ts` | No | Delete |
| `server/_core/imageGeneration.ts` | No | Delete |
| `server/_core/map.ts` | No | Delete |
| `server/_core/notification.ts` | No | Delete |
| `server/_core/voiceTranscription.ts` | No | Delete |
| `server/_core/sdk.ts` | Only for OAuth | Delete (Phase 3) |
| `server/_core/types/manusTypes.ts` | Only for OAuth | Delete (Phase 3) |
| `client/src/components/ManusDialog.tsx` | No | Delete |
| `client/src/components/Map.tsx` | No | Delete |
| `client/src/components/DashboardLayout.tsx` | No | Delete |
| `client/src/components/DashboardLayoutSkeleton.tsx` | No | Delete |
| `client/src/components/AIChatBox.tsx` | No | Delete |

---

## Summary: New Environment Variables (Post-Migration)

After full independence with Supabase, the `.env` file becomes:

```env
# === OWN INFRASTRUCTURE (preferred) ===
SUPABASE_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
LLM_API_URL=https://api.openai.com
LLM_API_KEY=sk-proj-your-openai-key
JWT_SECRET=random-64-char-string

# === MANUS FALLBACKS (auto-populated when deployed on Manus) ===
# DATABASE_URL=mysql://...  (Manus TiDB — used if SUPABASE_DATABASE_URL is not set)
# BUILT_IN_FORGE_API_URL=... (Manus Forge — used if LLM_API_URL is not set)
# BUILT_IN_FORGE_API_KEY=... (Manus Forge — used if LLM_API_KEY is not set)

# === OPTIONAL ===
PORT=3000
NODE_ENV=production
```

**Fallback priority chain:**
| Service | Primary (own) | Fallback (Manus) |
|---------|--------------|------------------|
| LLM | `LLM_API_URL` + `LLM_API_KEY` (OpenAI) | `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY` |
| Database | `SUPABASE_DATABASE_URL` (Postgres) | `DATABASE_URL` (MySQL/TiDB) |

**Removed variables (no longer needed regardless of environment):**
- `OAUTH_SERVER_URL`
- `VITE_APP_ID`
- `VITE_OAUTH_PORTAL_URL`
- `OWNER_OPEN_ID`
- `OWNER_NAME`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`

---

## Execution Order (Recommended)

| Phase | Priority | Effort | Risk |
|-------|----------|--------|------|
| Phase 1: LLM API | Critical | 15 min | Low — just rename env vars |
| Phase 2: Storage | Critical | 1 hour | Medium — need to move CV to public/ |
| Phase 6: Vite Plugins | Medium | 30 min | Medium — build might break temporarily |
| Phase 8: Cleanup | Low | 15 min | Zero — just deleting unused files |
| Phase 3: OAuth | Low | 30 min | Low — site already works without it |
| Phase 4: CDN | Low | 15 min | Zero — just moving one image |
| Phase 5: Analytics | Low | 10 min | Zero — custom analytics still works |
| **Phase 7: Supabase + DB Fallback** | **Final** | **2 hours** | **Medium — dual-driver (Postgres primary, MySQL fallback)** |

**Total estimated effort: ~4 hours**

> **Note:** Phase 7 (Supabase) is intentionally last because it's the most invasive change (dual-driver schema support). All other phases can be done independently and tested against the existing MySQL database. The dual-driver approach means the site **never breaks** — it always has a working database connection regardless of which environment it's deployed in. When you're ready to cut over fully to Supabase, simply stop setting `DATABASE_URL` and the MySQL fallback becomes dead code you can remove.

---

## Post-Migration Verification Checklist

1. `pnpm build` succeeds without errors
2. `pnpm start` starts the server
3. Chat responds to questions (LLM working)
4. CV downloads correctly (storage working)
5. Profile photo loads (local assets working)
6. Portfolio thumbnails load (local assets working)
7. Admin dashboard shows data (database working)
8. OG image renders when sharing URL (CDN independence)
9. No console errors referencing Manus/Forge
10. `grep -r "manus\|forge\|FORGE" --include="*.ts" --include="*.tsx"` returns zero results
