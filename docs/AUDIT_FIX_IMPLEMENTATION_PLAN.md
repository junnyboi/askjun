# askJun — Audit Fix Implementation Plan

**Based on:** `docs/CODE_AUDIT_REPORT.md` (18 findings)
**Estimated total effort:** ~2.5 hours across 4 phases
**Risk level:** Low — all changes are isolated refactors with no feature additions

---

## Understanding

This plan addresses all 18 findings from the frontend code audit, organized into 4 execution phases ordered by severity and dependency. Each phase is independently deployable — the site remains functional after each phase completes. No new features are introduced; this is purely a hardening and cleanup sprint.

**Non-goals:**
- No new UI features or visual changes
- No database schema changes
- No dependency upgrades
- No redesign of the chat engine or portfolio page

---

## Relevant Code

| File | Why It Matters |
|------|---------------|
| `server/routers.ts` | Contains the dead `auth` router (crash risk), unprotected admin endpoints, hardcoded password |
| `client/src/pages/Home.tsx` | Contains streaming setTimeout leak, unstable useCallback deps, inline PLACEHOLDERS |
| `client/src/pages/Admin.tsx` | Uses `any` types in 3 render loops |
| `client/src/components/ErrorBoundary.tsx` | Leaks stack traces in production |
| `server/_core/trpc.ts` | Contains unused `protectedProcedure` and `adminProcedure` |
| `server/_core/cookies.ts` | Unused after auth removal |
| `shared/const.ts` | Contains stale auth error constants |
| `server/auth.logout.test.ts` | Tests dead code that will crash |
| `client/src/components/*.tsx` (15 files) | Dead components from previous UI phases |

---

## Proposed Approach

**Phase 1 (Critical — 15 min):** Fix the runtime crash and security holes. Delete the auth router, add server-side admin middleware, move password to env.

**Phase 2 (Security + UX — 15 min):** Fix ErrorBoundary stack trace leak, replace `alert()` with toast.

**Phase 3 (Dead Code Cleanup — 20 min):** Delete ~15 unused components, stale auth infrastructure, dead test file.

**Phase 4 (Performance + Quality — 30 min):** Fix streaming timeout leak, useCallback deps, move PLACEHOLDERS to module scope, type Admin.tsx properly.

---

## Phase 1: Critical Fixes (15 min)

### 1.1 Delete the `auth` router from `server/routers.ts`

Remove lines 36-43 entirely. This eliminates the `COOKIE_NAME` crash and the dead `auth.me`/`auth.logout` endpoints.

```diff
- import { COOKIE_NAME } from "@shared/const";
- import { getSessionCookieOptions } from "./_core/cookies";

  export const appRouter = router({
    system: systemRouter,
-   auth: router({
-     me: publicProcedure.query(opts => opts.ctx.user),
-     logout: publicProcedure.mutation(({ ctx }) => {
-       const cookieOptions = getSessionCookieOptions(ctx.req);
-       ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
-       return { success: true } as const;
-     }),
-   }),
    chat: router({ ... }),
```

### 1.2 Add server-side admin password middleware

Create a reusable middleware that validates the password on every admin data query (not just `verify`):

```typescript
// In server/routers.ts — replace publicProcedure for admin queries
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mijun";

const adminGatedProcedure = publicProcedure.use(({ ctx, next }) => {
  const authHeader = ctx.req.headers["x-admin-password"];
  if (authHeader !== ADMIN_PASSWORD) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
  }
  return next({ ctx });
});
```

Then change all admin queries from `publicProcedure` to `adminGatedProcedure`.

### 1.3 Update `Admin.tsx` to send password header

After successful verification, store the password in component state and include it in all subsequent tRPC calls via a custom header:

```typescript
// In Admin.tsx — after login
const [adminPassword, setAdminPassword] = useState("");

// Pass to queries via httpHeaders
// Option: Use a custom link or fetch wrapper that adds x-admin-password header
```

**Alternative (simpler):** Add the password as an input parameter to every admin query (validated server-side). This avoids custom headers entirely:

```typescript
stats: adminGatedProcedure
  .input(z.object({ password: z.string(), from: z.string().optional(), to: z.string().optional() }))
  .query(async ({ input }) => {
    // password already validated by middleware
    ...
  }),
```

### 1.4 Move admin password to environment variable

Add `ADMIN_PASSWORD` to `server/_core/env.ts`:

```typescript
export const ENV = {
  ...
  adminPassword: process.env.ADMIN_PASSWORD || "mijun", // fallback for dev
};
```

---

## Phase 2: Security + UX (15 min)

### 2.1 Fix ErrorBoundary — hide stack traces in production

**File:** `client/src/components/ErrorBoundary.tsx`

```diff
  {/* Only show stack in development */}
- <pre className="...">{this.state.error?.stack}</pre>
+ {import.meta.env.DEV && (
+   <pre className="...">{this.state.error?.stack}</pre>
+ )}
+ {!import.meta.env.DEV && (
+   <p className="text-sm text-muted-foreground">An unexpected error occurred. Please reload the page.</p>
+ )}
```

### 2.2 Replace `alert()` with Sonner toast

**File:** `client/src/pages/Home.tsx` (line 187)

```diff
- alert("Conversation copied to clipboard!");
+ import { toast } from "sonner";
  ...
+ toast.success("Conversation copied to clipboard!");
```

Sonner is already installed and `<Toaster />` is mounted in `App.tsx`.

---

## Phase 3: Dead Code Cleanup (20 min)

### 3.1 Delete unused component files

The following files are never imported by any active page:

```bash
rm -f client/src/components/ChatCard.tsx
rm -f client/src/components/ChatPanel.tsx
rm -f client/src/components/ContactCard.tsx
rm -f client/src/components/ExperienceCard.tsx
rm -f client/src/components/HeroCard.tsx
rm -f client/src/components/HighlightsCard.tsx
rm -f client/src/components/SkillsCard.tsx
rm -f client/src/components/SkylineFooter.tsx
rm -rf client/src/components/nothing/
```

### 3.2 Delete stale auth infrastructure

```bash
rm -f server/_core/cookies.ts
rm -f server/auth.logout.test.ts
```

### 3.3 Clean `server/_core/trpc.ts`

Remove `protectedProcedure` and `adminProcedure` exports (they reference `ctx.user` which is always null). Keep only `publicProcedure` and `router`.

### 3.4 Clean `shared/const.ts`

Remove `UNAUTHED_ERR_MSG`, `NOT_ADMIN_ERR_MSG`, and `AXIOS_TIMEOUT_MS` (all unused).

### 3.5 Remove `getSessionCookieOptions` import from `server/routers.ts`

Already dead after Phase 1.1.

---

## Phase 4: Performance + Quality (30 min)

### 4.1 Fix streaming setTimeout leak

**File:** `client/src/pages/Home.tsx`

Add a ref to track the active timeout and clear it on unmount:

```typescript
const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Inside simulateStreaming:
streamingTimeoutRef.current = setTimeout(tick, delay);

// Add cleanup effect:
useEffect(() => {
  return () => {
    if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
  };
}, []);
```

### 4.2 Fix `handleSend` useCallback dependency on `messages`

Replace the `messages` dependency with a ref:

```typescript
const messagesRef = useRef(messages);
messagesRef.current = messages;

const handleSend = useCallback(async (text?: string) => {
  // Use messagesRef.current instead of messages
  const updatedMessages = [...messagesRef.current, userMsg];
  ...
}, [input, isTyping, chatMutation, simulateStreaming]);
```

### 4.3 Move `PLACEHOLDERS` to module scope

```diff
+ const PLACEHOLDERS = [
+   "Ask about Jun...",
+   "What's his experience with AI?",
+   "Tell me about his tech stack",
+   "What payment systems did he build?",
+   "Why is he looking for new roles?",
+ ];

  export default function Home() {
-   const PLACEHOLDERS = [...];
```

### 4.4 Type Admin.tsx query results properly

Replace `any` with inferred types:

```typescript
// Option A: Use ReturnType inference
type Visitor = NonNullable<typeof visitorsQuery.data>[number];
type Event = NonNullable<typeof recentEvents.data>[number];
type Question = NonNullable<typeof topQuestions.data>[number];

// Option B: Inline type assertion in map
{visitorsQuery.data?.map((v) => ( // TypeScript infers from the query
```

Since tRPC provides full type inference, removing the explicit `any` annotations should be sufficient — TypeScript will infer the types from the router definition.

---

## Compliance Checks

- **Structure:** All changes are deletions or modifications to existing files. No new directories or abstractions introduced.
- **Architecture:** Server-side admin gating follows the existing tRPC middleware pattern (`protectedProcedure` style).
- **React:** Ref-based timeout cleanup follows React 18+ best practices. Moving constants to module scope is standard.
- **Security:** Admin endpoints protected server-side. Stack traces hidden in production. Password moved to env var.
- **Responsive UI:** No UI changes — all fixes are logic/cleanup.

---

## Preflight Risk Checklist

| Category | Status |
|----------|--------|
| Logic | **Pass** — auth router deletion removes crash risk, no new logic introduced |
| Security | **Pass** — admin endpoints gated server-side, stack traces hidden, password in env |
| Architecture | **Pass** — follows existing tRPC middleware pattern |
| Structure | **Pass** — only deletions and modifications, no new files except potential `useChatEngine` hook |
| React | **Pass** — timeout cleanup via ref, stable useCallback deps |
| i18n | **N/A** — no user-visible text changes |
| Responsive UI | **Pass** — no layout changes |
| Reviewability | **Pass** — each phase is independently testable and deployable |

---

## Verification

| Command / Check | What It Proves |
|----------------|---------------|
| `npx tsc --noEmit` | Zero TypeScript errors after all changes |
| `pnpm test` | Existing tests still pass (after deleting dead test) |
| `curl /api/trpc/admin.stats` without password | Returns 401 (server-side protection works) |
| `curl /api/trpc/admin.stats` with `x-admin-password: mijun` | Returns data (auth works) |
| Navigate to `/admin`, enter wrong password | Shows error, no data loads |
| Navigate to `/admin`, enter correct password | Dashboard loads normally |
| Trigger an error in dev → see stack trace | ErrorBoundary shows stack in dev |
| Trigger an error in prod → no stack trace | ErrorBoundary shows generic message |
| Send 3 messages, navigate to `/portfolio`, return | No console warnings about unmounted setState |
| `grep -r "ChatCard\|ChatPanel\|HeroCard" client/src/pages/` | Zero results (dead code removed) |
| Share button → toast appears (not alert) | UX improvement verified |

---

## Execution Order

| Phase | Duration | Dependencies | Deployable After? |
|-------|----------|-------------|-------------------|
| Phase 1: Critical Fixes | 15 min | None | Yes |
| Phase 2: Security + UX | 15 min | None | Yes |
| Phase 3: Dead Code Cleanup | 20 min | Phase 1 (auth router must be deleted first) | Yes |
| Phase 4: Performance + Quality | 30 min | None | Yes |

**Total: ~1.5 hours** (less than the 2.5h estimate because phases can be parallelized)

---

## Open Questions

None — all changes are deterministic refactors with no product ambiguity.
