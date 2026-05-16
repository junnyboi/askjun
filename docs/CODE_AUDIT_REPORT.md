# askJun — Frontend Code Audit Report

**Auditor:** Manus AI (Frontend Reviewer)
**Date:** May 2026
**Scope:** Full codebase — `client/src/`, `server/`, `shared/`, configuration files
**Files Audited:** 30+ source files across frontend, backend, and shared modules

---

## Executive Summary

The askJun codebase is well-structured for a portfolio site with a clear separation between the chat-first landing page, portfolio showcase, and admin dashboard. The code is functional and ships correctly. However, the audit identified **4 critical issues**, **6 warnings**, and **8 suggestions** across security, performance, dead code, and architectural consistency.

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 4 | Security (admin unprotected), dead code (auth router), stale import, error boundary |
| 🟠 Warning | 6 | Performance, type safety, memory, architectural debt |
| 🟡 Suggestion | 8 | Readability, cleanup, best practices |

---

## 🔴 Critical Issues

### 1. Admin Dashboard Has No Server-Side Protection

**File:** `server/routers.ts` (lines 183-188)
**Category:** Security

The admin dashboard data endpoints (`admin.stats`, `admin.visitors`, `admin.topQuestions`, `admin.recentEvents`, `admin.dailyTraffic`) are all `publicProcedure`. The password check (`admin.verify`) only returns a boolean — it does not create a session token or gate subsequent requests. Anyone can call these endpoints directly via `curl` or browser DevTools without knowing the password.

> The password gate exists only in the React component state (`Admin.tsx`), which is trivially bypassable.

**Fix:** Either use `protectedProcedure` with a server-side admin session, or add a middleware that validates a password-derived token on every admin query. Alternatively, move the password check into a tRPC middleware that gates all admin sub-procedures.

---

### 2. Dead Auth Router Still Registered

**File:** `server/routers.ts` (lines 36-43)
**Category:** Dead Code / Runtime Error

The `auth` router is still registered with `me` and `logout` procedures, but `logout` references `COOKIE_NAME` which is imported from `@shared/const` — however the import at the top of the file does **not** include `COOKIE_NAME`. This will throw a `ReferenceError` at runtime if anyone calls `auth.logout`.

```typescript
auth: router({
  me: publicProcedure.query(opts => opts.ctx.user), // Always returns null
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, ...); // COOKIE_NAME is not imported!
  }),
}),
```

**Fix:** Delete the entire `auth` router since OAuth was removed. The `auth.me` always returns `null` and `auth.logout` will crash.

---

### 3. Error Boundary Exposes Stack Traces in Production

**File:** `client/src/components/ErrorBoundary.tsx`
**Category:** Security / UX

The error boundary renders `this.state.error?.stack` in a `<pre>` block visible to all users. In production, this leaks internal file paths, dependency versions, and potentially sensitive implementation details.

**Fix:** Only show stack traces in development (`import.meta.env.DEV`). In production, show a generic "Something went wrong" message with a reload button.

---

### 4. `COOKIE_NAME` Import Missing in routers.ts

**File:** `server/routers.ts` (line 1)
**Category:** Logical Error

The file uses `COOKIE_NAME` in the auth.logout mutation but the import line only imports `getSessionCookieOptions` from `_core/cookies`. The `COOKIE_NAME` symbol is undefined in this scope.

**Fix:** Remove the auth router entirely (see Critical #2), or add the import.

---

## 🟠 Warnings

### 5. In-Memory Rate Limiter Resets on Server Restart

**File:** `server/routers.ts` (line 13)
**Category:** Reliability

The rate limiter uses a `Map` in process memory. Every server restart (deploy, crash, auto-scaling) resets all rate limits. A determined user can bypass it by waiting for a deploy.

**Fix:** For a portfolio site this is acceptable, but document it as a known limitation. For production hardening, use Redis or the database.

---

### 6. `simulateStreaming` Uses Recursive `setTimeout` Without Cleanup

**File:** `client/src/pages/Home.tsx` (lines 106-133)
**Category:** Memory / Correctness

The `simulateStreaming` function uses recursive `setTimeout` to animate text character by character. If the component unmounts mid-animation (e.g., user navigates to `/portfolio`), the timeouts continue firing and call `setMessages` on an unmounted component. React 18+ handles this gracefully (no crash), but it's still a memory leak pattern.

**Fix:** Store the timeout ID in a ref and clear it on unmount, or use an AbortController pattern.

---

### 7. `useCallback` Dependency Array Includes `messages`

**File:** `client/src/pages/Home.tsx` (line 173)
**Category:** Performance

`handleSend` is wrapped in `useCallback` with `[input, isTyping, messages, chatMutation, simulateStreaming]`. Since `messages` is a new array reference on every state update, `handleSend` is recreated on every message — defeating the purpose of `useCallback`.

**Fix:** Use a ref for messages inside `handleSend` (read via `messagesRef.current`) or remove `useCallback` entirely since this function is only used in event handlers, not passed as a prop to memoized children.

---

### 8. Admin.tsx Uses `any` Types in 3 Render Loops

**File:** `client/src/pages/Admin.tsx` (lines 167, 221, 252)
**Category:** Type Safety

The map callbacks use `(v: any, i: number)`, `(e: any, i: number)`, `(q: any, i: number)`. This bypasses TypeScript's type checking for the entire render output of those loops.

**Fix:** Define proper types for the tRPC query results, or use `typeof` inference from the query hooks.

---

### 9. Unused Components Still in Codebase

**File:** `client/src/components/` (multiple)
**Category:** Dead Code

The following components are never imported anywhere in the active pages (`Home.tsx`, `Portfolio.tsx`, `Admin.tsx`):
- `ChatCard.tsx`
- `ChatPanel.tsx`
- `ContactCard.tsx`
- `ExperienceCard.tsx`
- `HeroCard.tsx`
- `HighlightsCard.tsx`
- `SkillsCard.tsx`
- `SkylineFooter.tsx`
- All `nothing/` directory components (Header, HeroSection, MetricsBar, ExperienceSection, SkillsSection, CaseStudies, ContactSection, Footer, LoadingOverlay)

These are remnants from the Glass Atelier and Nothing UI phases that were superseded by the chat-first redesign.

**Fix:** Delete all unused component files. They add ~2000 lines of dead code to the bundle (tree-shaking may not catch them if they have side effects in imports).

---

### 10. `PLACEHOLDERS` Array Recreated Every Render

**File:** `client/src/pages/Home.tsx` (lines 43-49)
**Category:** Performance (minor)

The `PLACEHOLDERS` array is defined inside the component body, meaning it's recreated on every render. The `useEffect` that references it has `[hasMessages]` as deps but should technically include `PLACEHOLDERS.length` — though since it's a constant, this doesn't cause bugs.

**Fix:** Move `PLACEHOLDERS` outside the component as a module-level constant.

---

## 🟡 Suggestions

### 11. `alert()` Used for Share Feedback

**File:** `client/src/pages/Home.tsx` (line 187)
**Category:** UX

`alert("Conversation copied to clipboard!")` blocks the UI thread and looks unprofessional. Use a toast notification (Sonner is already installed).

---

### 12. Hardcoded Admin Password in Source Code

**File:** `server/routers.ts` (line 187)
**Category:** Security / Configuration

The admin password `"mijun"` is hardcoded in the source code and committed to a public GitHub repository. Anyone reading the source can access the admin dashboard.

**Fix:** Move to an environment variable (`ADMIN_PASSWORD`).

---

### 13. `getSessionCookieOptions` Import is Unused

**File:** `server/routers.ts` (line 2)
**Category:** Dead Import

After OAuth removal, `getSessionCookieOptions` is only used in the dead `auth.logout` mutation. It should be removed along with the auth router.

---

### 14. `shared/const.ts` Contains Stale Auth Constants

**File:** `shared/const.ts`
**Category:** Dead Code

`UNAUTHED_ERR_MSG` and `NOT_ADMIN_ERR_MSG` are no longer used anywhere in the active codebase (auth was removed). They should be deleted.

---

### 15. `server/_core/trpc.ts` Contains Unused `protectedProcedure` and `adminProcedure`

**File:** `server/_core/trpc.ts`
**Category:** Dead Code

These procedures reference `ctx.user` which is always `null` after the auth removal. They are never used by any active router. Remove them to reduce confusion.

---

### 16. `server/_core/cookies.ts` is Likely Unused

**File:** `server/_core/cookies.ts`
**Category:** Dead Code

With OAuth removed, session cookies are no longer set or read. This file can be deleted.

---

### 17. Large Home.tsx File (~500 lines)

**File:** `client/src/pages/Home.tsx`
**Category:** Maintainability

The Home page contains all chat logic, message rendering, suggestion chips, profile zoom, back-to-top, keyboard shortcuts, and the header/footer. Consider extracting the chat logic into a custom hook (`useChatEngine`) and the message list into a separate component.

---

### 18. `server/auth.logout.test.ts` Tests Dead Code

**File:** `server/auth.logout.test.ts`
**Category:** Dead Test

This test file tests the `auth.logout` mutation which references `COOKIE_NAME` that doesn't exist. The test will fail if run. Delete it since auth was removed.

---

## Refactoring Recommendations (Priority Order)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Delete the `auth` router + fix `COOKIE_NAME` crash | 5 min | Prevents runtime error |
| 2 | Server-side admin password protection | 30 min | Closes security hole |
| 3 | Delete ~15 unused component files | 10 min | Removes ~2000 lines of dead code |
| 4 | Move admin password to env var | 5 min | Removes secret from public repo |
| 5 | Fix ErrorBoundary to hide stack in production | 10 min | Security + UX |
| 6 | Replace `alert()` with toast | 2 min | UX polish |
| 7 | Delete stale auth constants + cookies + trpc procedures | 10 min | Clean architecture |
| 8 | Extract chat logic from Home.tsx into a hook | 30 min | Maintainability |

---

## Positive Observations

The codebase demonstrates several strong practices worth noting:

The **dual-fallback architecture** (LLM + DB) is elegantly designed — the site never breaks regardless of which environment it's deployed in. The **analytics system** is well-implemented with fire-and-forget non-blocking tracking. The **typing simulation** with punctuation-aware pauses creates a convincing streaming UX. The **mobile responsive design** with the horizontal tab bar and back-to-top FAB shows attention to mobile UX. The **knowledge base** is comprehensive and well-structured for LLM consumption.

---

**End of Audit Report**
