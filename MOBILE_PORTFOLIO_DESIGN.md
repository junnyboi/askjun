# Portfolio Page — Mobile Responsive Audit & Design

## Current Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Sidebar nav hidden on mobile** — no way to jump between sections | High — users must scroll through the entire long page |
| 2 | **Breadcrumbs hidden on mobile** — no wayfinding context | Low — minor but adds to disorientation |
| 3 | **"Chat with AI" and "Download CV" links hidden on mobile** | Medium — key CTAs only in the footer |
| 4 | **Project grid is single-column** — fine, but cards could be more compact | Low — functional but verbose |
| 5 | **Key metrics overflow on narrow screens** — 4 metrics in a flex-wrap can look cramped | Low — works but not elegant |
| 6 | **No "back to top" button** — long page with 9 sections, no quick escape | Medium — frustrating on a 19-project page |

## Design Proposal: Horizontal Scrollable Tab Bar

**Solution:** Add a sticky horizontal scrollable tab bar below the header on mobile (< lg breakpoint). This mirrors the pattern used by YouTube, Twitter/X, and Google Maps for section navigation on mobile.

### Implementation

```
┌─────────────────────────────────────────┐
│ askJun  ·  Portfolio    [CV] [☀/☾]      │ ← Sticky header (existing)
├─────────────────────────────────────────┤
│ Experience | Skills | Projects | Game ▸  │ ← NEW: Horizontal scroll tabs
├─────────────────────────────────────────┤
│                                         │
│  [Content scrolls normally below]       │
│                                         │
└─────────────────────────────────────────┘
```

**Behavior:**
- Appears only on mobile (< lg breakpoint)
- Sticky below the header (top: 3rem)
- Horizontally scrollable with overflow-x-auto
- Active section highlighted with accent underline (tracked via IntersectionObserver — already implemented)
- Tapping a tab smooth-scrolls to that section
- Hide scrollbar with `scrollbar-width: none`

### Additional Mobile Fixes

1. **Compact metrics on mobile** — Show 2 per row instead of 4 inline
2. **Add "Back to top" FAB** — Floating button that appears after scrolling 400px
3. **Breadcrumb visible on mobile** — Show abbreviated "/ Portfolio" text
4. **Project cards** — Reduce padding and font sizes slightly on mobile for density

### Estimated Implementation: ~15 minutes
