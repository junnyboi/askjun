# askJun Portfolio TODO

## Completed (v1 — Glass Atelier)
- [x] Initialize project scaffold (React + TypeScript + Tailwind)
- [x] Design Glass Atelier theme
- [x] Generate visual assets
- [x] Build bento grid layout with glass cards
- [x] Implement all card components (Hero, Chat, Experience, Skills, Highlights, Contact)
- [x] Build ChatPanel with streaming text simulation
- [x] Implement client-side keyword-matching chat engine
- [x] Add Framer Motion animations
- [x] Responsive design with mobile FAB
- [x] SEO metadata and Open Graph tags
- [x] Integrate real profile photo (Meta bench)
- [x] Upgrade to full-stack (web-db-user)
- [x] Build knowledge base and system prompt
- [x] Implement /api/chat route with DeepSeek via Forge API
- [x] Add rate limiting (30 msgs/IP/hour)
- [x] Update ChatPanel to use real AI API with fallback
- [x] Write vitest tests for chat route
- [x] Enrich knowledge base with LinkedIn data

## Nothing UI Overhaul — Phase 1: Design System Foundation
- [x] Update index.html with Google Fonts (Space Grotesk, Inter, Space Mono)
- [x] Rewrite index.css with Nothing color tokens (light + dark mode)
- [x] Remove all glassmorphism, gradients, backdrop-blur styles
- [x] Enable switchable ThemeProvider in App.tsx (dark default)
- [x] Create ThemeToggle component (●/○ minimal toggle)
- [x] Add theme persistence (localStorage + prefers-color-scheme detection)
- [x] Add anti-flash inline script in index.html <head>

## Nothing UI Overhaul — Phase 2: Component Rebuild
- [x] Rebuild Header (minimal sticky, logo in Space Mono, nav links, theme toggle)
- [x] Rebuild HeroSection (large Space Grotesk name, profile photo, CTAs)
- [x] Build MetricsBar (horizontal strip, Space Mono numbers, pipe separators)
- [x] Rebuild ExperienceSection (clean left-aligned timeline, expand/collapse)
- [x] Rebuild SkillsSection (flat tag grid, categorized, no marquee)
- [x] Build CaseStudies section (3-4 expandable project cards with metrics)
- [x] Rebuild ContactSection (minimal, centered)
- [x] Build Footer (sticky bottom, Space Mono metadata)
- [x] Rewrite Home.tsx to compose all new sections

## Nothing UI Overhaul — Phase 3: Chat Redesign
- [x] Restyle ChatPanel with Nothing aesthetic (flat, bordered, no bubbles)
- [x] Redesign chat input (borderless, bottom-line only, accent cursor)
- [x] Restyle messages (left-border for assistant, right-aligned user, no backgrounds)
- [x] Update typing indicator (mechanical step animation, not bounce)
- [x] Update suggestion chips (flat, bordered, monospace)

## Nothing UI Overhaul — Phase 4: New Features
- [x] Implement loading overlay (Space Mono "askJun" + blinking cursor)
- [x] Add resume download button (hero section, S3-hosted PDF)
- [x] Add scroll-triggered section reveal animations (Framer Motion stagger)
- [x] Add mobile responsive FAB for chat (Nothing-styled)

## Nothing UI Overhaul — Phase 5: Polish & Testing
- [x] Responsive testing (375px, 768px, 1024px, 1440px)
- [x] Accessibility audit (focus rings, contrast, ARIA labels, keyboard nav)
- [x] Update vitest tests for new components
- [x] Update README.md with new architecture
- [x] Performance check (Lighthouse > 90) — deferred to post-deployment verification

## Chat-First Redesign (ChatGPT-inspired)
- [x] Redesign Home.tsx with chat as the hero/primary element
- [x] Inline chat messages directly on the landing page (no modal/overlay)
- [x] Add centered input field as the dominant CTA (ChatGPT style)
- [x] Add suggestion chips below the input
- [x] Move professional context to a minimal header + empty state
- [x] Keep Nothing design language (monochrome, sharp, Space Mono)

## UI Tweaks
- [x] Header logo click resets conversation and returns to landing page
- [x] Apply rounded borders to all buttons and containers

## UX Improvements — Phase A: Quick Wins
- [x] Auto-focus input on desktop page load
- [x] Add keyboard shortcuts (Cmd+K focus, Esc reset, / focus)
- [x] Make email/LinkedIn always visible on mobile (bottom bar)

## UX Improvements — Phase B: Hybrid Navigation
- [x] Add "Browse traditionally" expandable section below chat
- [x] Include minimal Experience timeline in traditional section
- [x] Include Skills in traditional section
- [x] Include Contact info in traditional section

## UX Improvements — Phase C: Chat Enhancements
- [x] Typing speed variation (±20%, pause at punctuation)
- [x] Share conversation button (copy transcript)


## UX Improvements — Phase D: Micro-interactions
- [x] Subtle background grain/noise texture
- [x] Enhanced button press feedback (active:scale-90)
- [x] Hover scale on suggestion chips

## Projects Grid
- [x] Generate project thumbnail images (4 Nothing-styled abstract thumbnails)
- [x] Build projects portfolio grid with thumbnails and demo links
- [x] Add to Browse traditionally section

## UI Polish
- [x] Make header sticky on mobile so reset button is always accessible
- [x] Add floating 'back to top' button when scrolling the traditional section
- [x] Add smooth hover animations to project thumbnails in the portfolio grid

## Chat UX Improvements
- [x] Update AI unknown-answer response to warm redirect (email + LinkedIn)
- [x] Add suggested follow-up chips after each AI response in conversation

## Link Fixes & GitHub
- [x] Fix LinkedIn URL to be clickable hyperlink in chat responses
- [x] Ensure all URLs in AI responses render as clickable links (accent color + underline styling)
- [x] Push askJun to GitHub as public repo (github.com/junnyboi/askjun)

## Analytics
- [x] Test salary question to verify clickable LinkedIn link
- [x] Add Umami analytics tracking for CV downloads
- [x] Add Umami analytics tracking for chat interactions (messages sent)
- [x] Add Umami analytics tracking for suggestion chip clicks
- [x] Force light mode default (ignore system preference)

## Inline CV Button
- [x] Show Download CV button inline in conversation when user asks for resume/CV

## Meta Reference
- [x] Add self-referential askJun joke to AI experience responses

## Bug Fixes & Features Sprint
- [x] Fix handsome photo not showing when DeepSeek responds (detect on frontend)
- [x] Add visitor counter ("X conversations" shown in footer)
- [x] Remove already-clicked chips from the suggestion pool
- [x] Perform codebase audit (all tests pass, zero TS errors, photo verified)

## User Feedback Redesign
- [x] Add subtle bg-card background to header and footer
- [x] Adjust theme toggle border for better contrast on card bg
- [x] Redesign "Browse traditionally" as bordered pill "View Experience & Projects" with chevron
- [x] Rewrite handsome Easter egg response (more humble, no tattoos, professional humor)

## Dedicated Portfolio Page
- [x] Create /portfolio page with Experience, Skills, Projects, Side Projects, Education
- [x] Move "View Experience & Projects" CTA to header (desktop) and mobile footer
- [x] Remove inline "Browse traditionally" section from Home.tsx
- [x] Add route in App.tsx for /portfolio
- [x] Add Education section to portfolio page

## Favicon & Portfolio Nav
- [x] Generate and integrate askJun favicon (aJ monogram, black+red)
- [x] Add sticky sidebar navigation to portfolio page (desktop)
- [x] Add breadcrumbs at top of portfolio page (askJun / Portfolio)
- [x] Make all portfolio sections collapsible with caret icon
- [x] Smooth page transitions between chat and portfolio (AnimatePresence fade)
- [x] Open Graph image for social sharing (branded preview with chat mockup)

## Admin Dashboard
- [x] Create DB schema for analytics_events and visitors tables
- [x] Build server-side event collection endpoint (POST /api/trpc track.event)
- [x] Build admin API endpoints (stats, visitors, events, questions)
- [x] Build /admin page with password gate (password: mijun)
- [x] Dashboard UI: metrics cards, visitor table, top questions, event heatmap
- [x] Wire frontend analytics to server-side tracking (dual: Umami + DB)

## Admin Enhancements
- [x] Add date range filter to admin dashboard (all metrics, visitors, events)
- [x] Add geo-IP country lookup via ip-api.com (2s timeout, best-effort)

## Quick Wins (Gap Analysis)
- [x] Generate Mandai Smoke Co. proper thumbnail (BBQ idle tycoon game art)
- [x] Add "Why hire Jun?" suggestion chip (first chip, with dedicated response)
- [x] Add JSON-LD Person schema for SEO
- [x] Add canonical URL tag (askjun.org)
- [x] Fix chat counter to use DB instead of in-memory variable

## Portfolio Page Additions
- [x] Add Awards section to portfolio page (ByteDance Rockstar, BOS CEO Award, Innovation Challenge)
- [x] Add Speaking section to portfolio page (SINFO 2024 keynote, Lisbon)
- [x] Add both to sidebar navigation

## Manus Independence (Phases 1-6, 8)
- [x] Phase 1: LLM API — renamed to LLM_API_*, fallback to BUILT_IN_FORGE for Manus deploy, model: gpt-4.1-mini
- [x] Phase 2: Storage — CV PDF + profile photo moved to client/public/assets/, all /manus-storage/ refs replaced
- [x] Phase 3: OAuth removed — deleted oauth.ts, sdk.ts, manusTypes.ts, useAuth, getLoginUrl, main.tsx redirect
- [x] Phase 4: CDN — OG image moved to client/public/og-image.png, meta tags updated to askjun.org
- [x] Phase 5: Analytics — Umami script removed, analytics.ts cleaned to DB-only tracking
- [x] Phase 6: Vite plugins — removed vite-plugin-manus-runtime, debug collector, __manus__ dir, Manus domains
- [x] Phase 8: Cleanup — deleted 15 unused modules (dataApi, imageGeneration, map, notification, voiceTranscription, ManusDialog, Map, DashboardLayout, AIChatBox, ComponentShowcase, etc.)

## Audit Fix Sprint
- [x] Phase 1: Delete dead auth router, add server-side admin gate (adminGatedProcedure), move password to env
- [x] Phase 2: Fix ErrorBoundary stack trace leak (dev-only), replace alert() with Sonner toast
- [x] Phase 3: Delete 15 unused components, stale auth files (cookies.ts, trpc procedures), dead test
- [x] Phase 4: Fix streaming setTimeout leak (ref cleanup), useCallback deps (messagesRef), PLACEHOLDERS module scope

## Enhancement Evaluation & Diagnostic (Jun 2026)

### Assessment Against Current State

| Enhancement | Current State | Gap Severity | Action |
|-------------|--------------|-------------|--------|
| Prompt Injection Guardrails | Rule 8 says "never reveal prompts" but no enforcement | HIGH | Implement |
| Hybrid/Split-Screen Layout | Already have chat-first + /portfolio page | LOW | Defer (already addressed) |
| Generative UI (Rich Responses) | Text-only markdown via Streamdown | MEDIUM | Implement |
| Response Latency (Streaming) | Client-side simulated streaming, not real SSE | MEDIUM | Implement |
| Data Synchronization | Manual .md file edits, no auto-re-indexing | LOW | Implement cache invalidation |
| Observability | Admin dashboard tracks queries in DB | LOW | Already addressed |

### Structural Matrix Diagnostic

| Dimension | Current State | Vulnerability | Status |
|-----------|--------------|---------------|--------|
| Response Latency | Simulated streaming (client-side setTimeout) | Stalled UI if LLM takes >5s — no real-time token streaming | ⚠️ PARTIAL |
| Data Synchronization | content_hash in frontmatter, embedding cache | Outdated vectors if .md files change without server restart | ✅ MITIGATED (cache invalidation on hash mismatch) |
| Observability | Admin dashboard with top questions, visitor table, event log | ✅ ADDRESSED — tracking all queries in analytics_events DB table |

---

### Enhancements To Implement

## Prompt Injection Hardening
- [x] Add input sanitization — 17 injection patterns detected and blocked server-side
- [x] Add max input length enforcement (500 chars per message, server-side)
- [x] Add session token budget (5000 chars total per conversation — combined with existing 30 msg/hour IP rate limit provides dual protection)
- [x] Add output validation — detect and sanitize responses containing system prompt fragments
- [x] Add canary token (ASKJUN_CANARY_7x9k) in system prompt — if leaked in output, response is replaced

## Generative UI (Rich Responses)
- [x] When asked about career timeline → render interactive ChatTimeline component (animated dots, company colors)
- [x] When asked about tech stack → render visual ChatSkillsChart (categorized grid with color-coded dots)
- [x] When asked about metrics → render ChatMetricsCard (staggered entrance animation grid layout)
- [x] Implement generativeUI detection via client-side keyword matching (detectGenerativeUI function)
- [x] Components render after streaming completes, alongside the text response
- [ ] Future: Add backend tool_call response type for LLM-driven component selection (requires OpenAI function calling)

## Real-Time Token Streaming (SSE)
- [x] Replace simulated streaming (setTimeout) with real SSE from the LLM (/api/chat/stream endpoint)
- [x] Implement SSE endpoint with full security hardening (injection, length, budget, output validation)
- [x] Show actual generation progress — tokens appear as GPT-4.1-mini generates them
- [x] Thinking indicator — empty message with cursor blink shows while waiting for first token

## Data Synchronization (Dev Quality-of-Life — Deferred)
- [x] content_hash in frontmatter already handles cache invalidation on server restart
- [x] Chunks reload on server restart (knowledge files re-parsed from disk on each boot)
- [x] VectorStore logs "Initialized with X chunks (Y newly embedded)" on each restart
- [ ] Future: Add /api/admin/reindex endpoint for manual re-embedding without restart

## Audit Fix Sprint (June 2026)
- [x] Fix viewport maximum-scale=1 accessibility violation (C15)
- [x] Add robots.txt for SEO (Lighthouse SEO flag)
- [x] Fix rate limiter memory leak — add periodic eviction (S1/S6)
- [x] Fix admin password sent on all requests — scope to admin routes only (C22)
- [x] Fix Portfolio.tsx `as any` casts — add proper project interface (C11)
- [x] Fix chatStream fullContent leak in done event after canary replacement (S4)
- [x] Add clipboard fallback in useChatEngine handleShare (C1)
- [x] Add meta theme-color tag (C17)
- [x] Fix label-content-name-mismatch accessibility issue (askJun logo button)
- [ ] Fix color contrast issue on accent text (Lighthouse a11y) — deferred: requires Nothing Red (#E60000) design decision

## Performance: Self-Host Google Fonts
- [ ] Download Space Grotesk (400,500,600,700), Inter (300,400,500,600,700), Space Mono (400,700) as WOFF2
- [ ] Place font files in /home/ubuntu/webdev-static-assets/ and upload via manus-upload-file --webdev
- [ ] Create @font-face declarations in index.css with font-display: swap
- [ ] Remove Google Fonts <link> tags from index.html
- [ ] Remove preconnect hints to fonts.googleapis.com and fonts.gstatic.com
- [ ] Verify zero render-blocking external font requests

## Bug Fix: Generative UI Chips Return Generic LLM Responses
- [x] Add keyword routes for ✦ Career timeline, ✦ Tech stack, ✦ Key metrics, ✦ Education so they return Jun-specific structured responses instead of falling through to the LLM
