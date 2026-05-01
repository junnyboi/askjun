# askJun UI Overhaul — Nothing Design Philosophy

**Date:** April 30, 2026
**Prepared for:** Boh Ze Jun (Poseidon)
**Author:** Manus AI

---

## 1. Executive Summary

This document presents a comprehensive plan to redesign the askJun portfolio website following Nothing's design philosophy — raw industrial minimalism, dot-matrix typography, stark monochromatic palettes, and deliberate transparency. The redesign introduces a full light/dark mode system and addresses feature gaps identified through competitor analysis of top developer portfolios in 2026.

Nothing's design language is characterized by three core principles: **transparency** (exposing inner workings), **intentionality** (stripping away the unnecessary), and **retro-futurism** (combining nostalgic digital elements with modern technology) [1]. This aesthetic will differentiate askJun from the thousands of generic glassmorphism and gradient-heavy portfolios flooding the market.

---

## 2. Competitor Analysis: What We're Missing

Based on research across 50+ developer portfolios and recruiter feedback from 2026, the following table summarizes our current feature gaps:

| Feature | Current State | Competitor Standard | Priority |
|---------|--------------|-------------------|----------|
| Light/Dark mode toggle | Dark only | Both modes with smooth transition | **Critical** |
| Theme persistence | None | localStorage + system preference detection | **Critical** |
| Loading state/overlay | None | Branded loading animation | High |
| Project case studies | Not present | Deep-dive pages with metrics + visuals | High |
| Downloadable resume | Not present | One-click PDF download | High |
| Micro-interactions | Basic hover only | Purposeful hover, focus, and scroll animations | High |
| SEO & Open Graph | Basic meta tags | Dynamic OG images, structured data | Medium |
| Accessibility | Partial | Full WCAG 2.1 AA compliance | Medium |
| Analytics dashboard | None (Umami only) | Visitor insights for owner | Low |
| Blog/writing section | Not present | Technical articles demonstrating expertise | Low |

---

## 3. Nothing Design System — Translated to Web

### 3.1 Color Architecture

The Nothing palette is intentionally constrained. We implement a **3-tiered token system** that maps cleanly to both light and dark modes [2]:

**Light Mode:**

| Token | Role | Value |
|-------|------|-------|
| `--bg-primary` | Page background | `#FFFFFF` |
| `--bg-secondary` | Card/section background | `#F7F7F5` |
| `--bg-tertiary` | Elevated surfaces | `#EFEFED` |
| `--text-primary` | Headings, body | `#000000` |
| `--text-secondary` | Muted text, labels | `#595A5A` |
| `--text-tertiary` | Metadata, timestamps | `#9CA3AF` |
| `--border` | Dividers, card borders | `#E5E7EB` |
| `--accent` | CTAs, active states | `#E60000` (Nothing Red) |
| `--accent-hover` | Hover state | `#CC0000` |

**Dark Mode:**

| Token | Role | Value |
|-------|------|-------|
| `--bg-primary` | Page background | `#0A0A0A` |
| `--bg-secondary` | Card/section background | `#141414` |
| `--bg-tertiary` | Elevated surfaces | `#1E1E1E` |
| `--text-primary` | Headings, body | `#F4F4F4` |
| `--text-secondary` | Muted text, labels | `#B1B3B3` |
| `--text-tertiary` | Metadata, timestamps | `#6B7280` |
| `--border` | Dividers, card borders | `#2A2A2A` |
| `--accent` | CTAs, active states | `#E60000` (Nothing Red) |
| `--accent-hover` | Hover state | `#FF1A1A` |

### 3.2 Typography System

Nothing's typography is its most recognizable element. We implement a three-font hierarchy [3]:

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display/Hero | **Space Grotesk** | 700 | Hero name, section headers, key metrics. Geometric, technical feel similar to NType82 |
| Body | **Inter** | 400, 500 | Body text, descriptions, chat messages. Clean and highly legible |
| Mono/Technical | **Space Mono** | 400 | Code snippets, metadata, timestamps, labels. Evokes the dot-matrix NDot aesthetic |

> **Why Space Grotesk over NDot?** NDot is proprietary and not available via Google Fonts. Space Grotesk captures the same geometric, technical energy while being freely available and WCAG-compliant at body sizes. Space Mono serves as our "dot-matrix nod" for technical elements.

**Type Scale (8px rhythm):**

| Element | Desktop | Mobile | Line Height |
|---------|---------|--------|-------------|
| H1 (Hero name) | 64px / 4rem | 40px / 2.5rem | 1.1 |
| H2 (Section) | 32px / 2rem | 24px / 1.5rem | 1.2 |
| H3 (Card title) | 20px / 1.25rem | 18px / 1.125rem | 1.3 |
| Body | 16px / 1rem | 16px / 1rem | 1.6 |
| Small/Label | 13px / 0.8125rem | 13px | 1.4 |
| Mono/Meta | 12px / 0.75rem | 12px | 1.5 |

### 3.3 Spacing & Grid

Following Nothing's disciplined grid system with an **8px base unit**:

- **Grid:** 12-column on desktop, 4-column on mobile
- **Gutter:** 24px (desktop), 16px (mobile)
- **Section padding:** 96px vertical (desktop), 64px (mobile)
- **Card padding:** 32px (desktop), 24px (mobile)
- **Component gap:** 16px standard, 8px compact

### 3.4 Component Styling

Nothing's components are defined by **sharp precision** and **thin borders** rather than shadows:

- **Border radius:** 0px for most elements (sharp, industrial). 4px maximum for input fields and small buttons
- **Borders:** 1px solid, using `--border` token
- **Shadows:** Avoided entirely in light mode. In dark mode, use `0 1px 2px rgba(0,0,0,0.3)` only for elevated modals
- **Cards:** Flat with 1px border, no background gradient. Hover state: border color transitions to `--accent`
- **Buttons:** Solid fill for primary (black bg, white text in light mode; white bg, black text in dark mode). Ghost/outline for secondary

### 3.5 Animation Philosophy

Nothing's animations are **mechanical, precise, and purposeful** — never bouncy or playful [4]:

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Page load | Fade in + slight upward translate (8px) | 400ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Card hover | Border color to accent, subtle scale(1.005) | 200ms | `ease-out` |
| Theme toggle | Crossfade via View Transitions API | 300ms | `ease-in-out` |
| Chat panel | Slide up from bottom | 350ms | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Section reveal | Fade in on scroll intersection | 500ms | `ease-out` |
| Button press | Scale(0.97) on mousedown | 100ms | `ease-in` |
| Cursor blink | Opacity toggle | 530ms | `step-end` |

---

## 4. Layout Architecture

### 4.1 Homepage Structure

The homepage transitions from a bento grid to a **vertical scroll with modular sections**, reflecting Nothing's disciplined, content-first approach:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (sticky, minimal)                               │
│  [Logo: "askJun" in Space Mono]  [Nav links]  [●/○ toggle] │
├─────────────────────────────────────────────────────────┤
│  HERO SECTION                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Name: "BOH ZE JUN" (Space Grotesk 700, 64px)  │    │
│  │  Title: "Senior Frontend Engineer" (Inter 400)  │    │
│  │  Status: ● Available (accent red dot)           │    │
│  │  [Profile photo]  [Brief tagline]               │    │
│  │  [Chat CTA button]  [Download CV button]        │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  METRICS BAR (horizontal strip, monospace numbers)      │
│  $57M  |  15M+  |  8M DAU  |  100+ countries           │
├─────────────────────────────────────────────────────────┤
│  EXPERIENCE (timeline, left-aligned)                    │
│  Each entry: company | role | period | expandable       │
├─────────────────────────────────────────────────────────┤
│  SKILLS (grid of flat tags, categorized)                │
├─────────────────────────────────────────────────────────┤
│  PROJECTS / CASE STUDIES (card grid, 2-col)             │
├─────────────────────────────────────────────────────────┤
│  CONTACT (minimal, centered)                            │
├─────────────────────────────────────────────────────────┤
│  FOOTER (sticky bottom, Space Mono metadata)            │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Chat Interface

The chat panel retains its slide-up behavior but adopts Nothing's aesthetic:
- **Background:** `--bg-secondary` with 1px top border
- **Messages:** No bubble backgrounds. User messages right-aligned in `--text-primary`, assistant messages left-aligned with a subtle left border in `--accent`
- **Input:** Flat, borderless input field with a single bottom border. Blinking cursor in `--accent`
- **Typography:** Inter for messages, Space Mono for metadata (timestamps, "Powered by DeepSeek")

---

## 5. New Features to Implement

### 5.1 Light/Dark Mode Toggle

Implementation approach using CSS custom properties and the `prefers-color-scheme` media query:

- **Toggle UI:** A minimal circle icon (● filled = dark, ○ outline = light) in the header
- **Persistence:** Save preference to `localStorage`, respect system preference on first visit
- **Transition:** Use View Transitions API for a smooth crossfade (300ms). Disable if `prefers-reduced-motion` is active
- **Font weight adjustment:** Reduce body weight from 400 to 350 in dark mode to prevent "blooming" [5]

### 5.2 Resume Download Button

- Prominent CTA in the hero section: "Download CV" with a download icon
- Serves the PDF from S3 storage (already uploaded)
- Track downloads via Umami analytics event

### 5.3 Loading Overlay

- Branded loading state on initial page load
- Display "askJun" in Space Mono with a blinking cursor animation
- Fade out once all critical assets are loaded (fonts + hero image)
- Duration cap: 2 seconds maximum

### 5.4 Project Case Studies Section

Add 3-4 case study cards highlighting key projects:
1. **Manus AI Agent Interface** — Real-time streaming, multi-turn conversations
2. **HoYoverse Payment System** — $57M launch week, 50+ payment methods
3. **TikTok GDPR Compliance** — Regulatory deadline, multi-million-euro fines averted
4. **Bank of Singapore Innovation** — $1.5M savings, genetic algorithm optimizer

Each card: title, one-line description, 2-3 key metrics, "Read more" expanding to full detail.

### 5.5 Improved Accessibility

- All interactive elements have visible focus rings (2px solid `--accent`)
- Skip-to-content link
- ARIA labels on all icon-only buttons
- Minimum 4.5:1 contrast ratio for all text
- Keyboard-navigable chat interface

---

## 6. Implementation Phases

### Phase 1: Design System Foundation (Day 1)

| Task | Details |
|------|---------|
| Update `index.css` | New color tokens, typography imports, spacing scale |
| Update `index.html` | Google Fonts: Space Grotesk + Inter + Space Mono |
| Update `App.tsx` | Enable switchable ThemeProvider |
| Create theme toggle component | Minimal ●/○ toggle with localStorage persistence |
| Update global styles | Remove all glassmorphism, gradients, backdrop-blur |

### Phase 2: Component Rebuild (Day 2-3)

| Task | Details |
|------|---------|
| Header | Minimal sticky header with logo, nav, theme toggle |
| Hero section | Large typography, profile photo, CTAs |
| Metrics bar | Horizontal strip with Space Mono numbers |
| Experience timeline | Clean left-aligned timeline with expand/collapse |
| Skills section | Flat tag grid, categorized, no marquee |
| Contact section | Minimal centered layout |
| Footer | Sticky, Space Mono metadata |

### Phase 3: Chat Redesign (Day 3)

| Task | Details |
|------|---------|
| Chat panel styling | Nothing aesthetic: flat, bordered, no bubbles |
| Chat input | Borderless with bottom-line, accent cursor |
| Message rendering | Left-border for assistant, right-aligned user |
| Loading states | Mechanical typing indicator (three dots, step animation) |

### Phase 4: New Features (Day 4)

| Task | Details |
|------|---------|
| Loading overlay | Branded splash with Space Mono + cursor blink |
| Resume download | S3-hosted PDF, download button in hero |
| Case studies section | 3-4 expandable project cards |
| Scroll animations | Intersection Observer fade-in reveals |

### Phase 5: Polish & Testing (Day 5)

| Task | Details |
|------|---------|
| Responsive testing | Mobile, tablet, desktop breakpoints |
| Accessibility audit | Focus rings, contrast, ARIA labels, keyboard nav |
| Performance | Lighthouse score > 90, font preloading |
| Cross-browser | Chrome, Firefox, Safari, Edge |
| Final vitest | Update tests for new components |

---

## 7. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme system | CSS custom properties + ThemeContext | Already scaffolded, minimal refactor |
| Fonts | Google Fonts CDN | Free, fast, no licensing issues |
| Animations | Framer Motion (existing) | Already installed, spring physics support |
| View Transitions | CSS `@view-transition` | Native, no library needed |
| Icons | Lucide React (existing) | Already installed, monochromatic |
| Border radius | 0px globally | Nothing's sharp, industrial aesthetic |
| Shadows | Removed entirely | Nothing uses borders, not shadows |

---

## 8. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| NDot font not available | Use Space Mono as dot-matrix substitute |
| Sharp corners feel too harsh | Allow 2px radius on small interactive elements only |
| Pure black/white too stark | Use `#0A0A0A` and `#F4F4F4` for slight warmth |
| Chat readability in light mode | Ensure message contrast meets WCAG 4.5:1 |
| Theme flash on load | Inline script in `<head>` to set theme class before render |

---

## 9. Success Metrics

After implementation, the portfolio should achieve:

- **Lighthouse Performance:** > 90
- **Lighthouse Accessibility:** > 95
- **First Contentful Paint:** < 1.5s
- **Theme toggle:** < 300ms transition, no flash
- **Chat response time:** < 2s to first token
- **Mobile usability:** Full functionality on 375px viewport

---

## References

[1] Nothing Design Philosophy — https://nothing.tech/
[2] 3-Tiered Color Token System — https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/
[3] Nothing Typography (NDot, NType82) — https://nothing.community/en/d/104-ndot57-the-nothing-typeface
[4] Nothing Web Animations — https://www.awwwards.com/sites/nothing-design-studio
[5] Dark Mode Font Weight Adjustment — https://medium.com/@social_7132/dark-mode-done-right-best-practices-for-2026-c223a4b92417
