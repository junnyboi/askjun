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
