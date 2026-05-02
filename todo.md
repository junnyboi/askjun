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
