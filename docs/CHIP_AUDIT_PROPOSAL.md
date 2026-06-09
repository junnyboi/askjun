# Chip Audit & Improvement Proposal

## Current State Audit

### 1. Landing Page Chips (CHAT_SUGGESTIONS)
**Location:** `client/src/pages/Home.tsx` line 282
**Source:** `client/src/data/portfolio.ts` → `CHAT_SUGGESTIONS` array
**Display:** First 3 chips shown (filtered by `usedChips`), centered below input
**Current chips:**
1. "Why should I hire Jun?" → keyword router (instant ⚡)
2. "Show me his career timeline" → triggers ChatTimeline generative UI
3. "What's his tech stack?" → triggers ChatSkillsChart generative UI
4. "What are his key achievements?" → triggers ChatMetricsCard generative UI
5. "Where did he study?" → triggers ChatEducationTimeline generative UI
6. "Tell me about his work at Meta/Manus" → semantic (LLM)
7. "What's Jun's experience with AI agent interfaces?" → semantic (LLM)

**Issue:** Only 3 visible at a time. The generative UI triggers (#2-5) may never be seen if user clicks the first 3.

### 2. Follow-Up Chips (getFollowUps)
**Location:** `client/src/pages/Home.tsx` line 398-425
**Source:** `client/src/data/followUps.ts` → topic-based mapping
**Display:** After each assistant response, shows 2-3 contextual follow-ups
**Trigger:** Based on keyword matching against the user's last query
**Topics covered:** meta, manus, ai, payment, hoyo, tiktok, gdpr, bank, stack, looking, salary, challenge, education, awards, handsome, hello

**Issue:** Follow-ups don't reference generative UI triggers. A user asking about "payment" gets text-based follow-ups but never sees "Show me his career timeline" or "What are his key achievements?"

### 3. Easter Egg Chip
**Location:** Injected at 3rd message exchange
**Content:** "What does he look like?"
**Condition:** Only if user hasn't already asked about appearance

---

## Problems Identified

| # | Problem | Impact |
|---|---------|--------|
| 1 | Only 3 landing chips visible — generative UI triggers buried at positions 4-5 | Users may never discover interactive components |
| 2 | Follow-up chips never suggest generative UI | Missed opportunity to showcase the best features |
| 3 | Landing chips are static — same order every time | Returning visitors see the same chips |
| 4 | No visual distinction between instant/generative/semantic chips | Users can't tell which chips will show rich UI |

---

## Improvement Proposal

### A. Restructure Landing Page Chips (2 rows)

**Row 1 — "Quick answers" (keyword instant):**
- "Why should I hire Jun?"
- "What's his current role?"
- "How many years of experience?"

**Row 2 — "Explore visually" (generative UI triggers, with ✦ icon prefix):**
- "✦ Career timeline"
- "✦ Tech stack"
- "✦ Key metrics"
- "✦ Education"

This creates a clear visual hierarchy: text answers above, interactive components below.

### B. Inject Generative UI into Follow-Ups

After certain topics, suggest a generative UI chip:
- After "payment" → add "✦ Show career timeline"
- After "ai" → add "✦ View tech stack"
- After "challenge" → add "✦ Key metrics & impact"
- After "education" → add "✦ Full education timeline"

### C. Show More Chips on Desktop

Change from `slice(0, 3)` to `slice(0, 4)` on desktop (sm+) to show one more chip.

### D. Randomize Order for Returning Visitors

Shuffle the CHAT_SUGGESTIONS array on each page load so returning visitors see different chips first.

---

## Recommended Implementation

1. Split landing chips into 2 rows (quick answers + generative UI)
2. Add ✦ prefix to generative UI chips for visual distinction
3. Show 4 chips on desktop, 3 on mobile
4. Inject generative UI suggestions into follow-up chips
5. Keep the Easter egg chip injection at 3rd message (unchanged)
