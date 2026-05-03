# askJun Portfolio — Gap Analysis

**Date:** May 3, 2026
**Auditor:** Manus AI

---

## Summary

After a thorough review of the live site (landing page, portfolio page, chat, admin dashboard), the following gaps and improvement opportunities were identified across 5 categories.

---

## 1. Content Gaps

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1.1 | **Mandai Smoke Co. still uses abstract placeholder thumbnail** — every other Featured Project has a proper mockup | Medium — visual inconsistency in the grid | Low |
| 1.2 | **askJun project card uses a dark abstract image** — should show an actual screenshot of the askJun site itself | Medium — meta-flex opportunity missed | Low |
| 1.3 | **No "Speaking" section** — Jun keynoted at SINFO 2024 in Lisbon. This is a strong differentiator that deserves its own section on the portfolio page | High — public speaking signals leadership | Medium |
| 1.4 | **No "Awards" section on the portfolio page** — awards are in the knowledge base but not visually displayed (ByteDance Rockstar, BOS CEO Award, Innovation Challenge) | High — social proof is buried | Medium |
| 1.5 | **DBS Bank experience missing from portfolio page** — the data scientist role at DBS is in the knowledge base but not rendered in the Experience section | Low — short internship, but completeness matters | Low |

## 2. UX Gaps

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 2.1 | **No 404 custom page** — visiting `/anything` shows the default NotFound page which doesn't match the Nothing design | Low — rare but jarring when hit | Low |
| 2.2 | **No loading state for AI responses on slow connections** — if DeepSeek takes 3+ seconds, the user sees nothing happening after pressing send | Medium — perceived as broken | Low |
| 2.3 | **Mobile portfolio page has no section navigation** — sidebar is desktop-only (lg+). On mobile, users must scroll through the entire page | Medium — long page with no shortcuts | Medium |
| 2.4 | **Chat input doesn't auto-resize** — typing a long question keeps it at 2 rows, requiring scrolling inside the textarea | Low — functional but not ideal | Low |
| 2.5 | **No "New conversation" button visible in chat mode** — users must click the askJun logo to reset, which isn't obvious | Medium — discoverability issue | Low |

## 3. Technical Gaps

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 3.1 | **Admin dashboard data endpoints are not password-protected server-side** — the password gate is client-side only. Anyone can call `/api/trpc/admin.stats` directly | High — security vulnerability | Medium |
| 3.2 | **In-memory chat counter resets on server restart** — the "X conversations" counter in the footer uses a variable, not the DB | Low — cosmetic, analytics DB tracks real data | Low |
| 3.3 | **No error boundary on the chat** — if DeepSeek returns malformed data, the entire page could crash | Medium — resilience gap | Low |
| 3.4 | **No rate limit feedback in UI** — when a user hits the 30 msg/hour limit, the response says "rate limited" but there's no visual indicator or countdown | Low — edge case | Low |

## 4. SEO & Performance Gaps

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 4.1 | **No structured data (JSON-LD)** — adding Person schema would help Google understand this is a professional portfolio | Medium — SEO boost | Low |
| 4.2 | **No sitemap.xml** — helps search engines discover both pages (/ and /portfolio) | Low — basic SEO hygiene | Low |
| 4.3 | **No canonical URL tag** — multiple domains (askjun.org, askjun.manus.space) could cause duplicate content issues | Medium — SEO deduplication | Low |

## 5. Missing "Wow Factor" Features

| # | Feature | Why It Matters | Effort |
|---|---------|---------------|--------|
| 5.1 | **Testimonial/recommendation quotes** — pull quotes from managers or colleagues would add massive social proof | High — recruiters trust peer endorsements | Medium |
| 5.2 | **Interactive skills radar chart** — visual representation of skill proficiency levels instead of flat tags | Medium — visual differentiation | Medium |
| 5.3 | **"Why hire Jun?" pre-built chip** — a single question that triggers the AI to deliver a compelling 30-second pitch combining all best metrics | High — the money question recruiters want answered | Low |

---

## Recommended Priority Order

**Quick wins (< 30 min each):**
1. Generate Mandai Smoke Co. thumbnail (1.1)
2. Add "Why hire Jun?" suggestion chip (5.3)
3. Add JSON-LD Person schema (4.1)
4. Add canonical URL tag (4.3)
5. Fix chat counter to use DB instead of memory (3.2)

**Medium effort (1-2 hours each):**
6. Add Awards section to portfolio page (1.4)
7. Add Speaking section to portfolio page (1.3)
8. Add mobile section nav (horizontal tabs) for portfolio (2.3)
9. Server-side password protection for admin endpoints (3.1)

**Nice-to-haves:**
10. Testimonial quotes section (5.1)
11. Interactive skills radar chart (5.2)
12. Custom 404 page (2.1)
