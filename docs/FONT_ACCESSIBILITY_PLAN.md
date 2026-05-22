# Font Accessibility Implementation Plan — Option C

**Goal:** Improve readability for all users while preserving the Nothing design aesthetic. Add a font size toggle that lets users choose their comfort level.

**Estimated effort:** 30 minutes
**Risk level:** Low — CSS-only scaling, no logic changes

---

## Architecture

```
localStorage("askjun_font_scale") → "default" | "large" | "xlarge"
         ↓
CSS custom property: --font-scale: 1 | 1.15 | 1.3
         ↓
All text sizes multiply by var(--font-scale)
         ↓
"Aa" toggle button in header cycles through sizes
```

---

## File-Level Plan

### 1. `client/src/index.css` — Increase base font to 16px, add --font-scale variable, improve muted contrast
### 2. `client/src/hooks/useFontScale.ts` — New hook: manage scale state, persist localStorage, apply class
### 3. `client/src/components/FontScaleToggle.tsx` — "Aa" button cycling Default/Large/XL
### 4. `client/index.html` — Anti-flash script for font scale
### 5. `client/src/pages/Home.tsx` — Add toggle to header, switch chat text to Inter
### 6. `client/src/pages/Portfolio.tsx` — Switch body text to Inter

## Font Scale Levels

| Level | Class | Scale | Base | Body | Chips | Min |
|-------|-------|-------|------|------|-------|-----|
| Default | (none) | 1 | 16px | 16px | 12px | 12px |
| Large | font-large | 1.15 | 18.4px | 18.4px | 13.8px | 13.8px |
| Extra Large | font-xlarge | 1.3 | 20.8px | 20.8px | 15.6px | 15.6px |

## Key Typography Changes

| Element | Before | After |
|---------|--------|-------|
| Chat responses | Space Mono | Inter (font-sans) |
| Body text | Space Mono | Inter (font-sans) |
| Chips/metrics | Space Mono | Space Mono (unchanged) |
| Header logo | Space Mono | Space Mono (unchanged) |
| Base font-size | 14px | 16px * var(--font-scale) |
| Muted opacity | 0.4 | 0.65 |
| Min text | 10px | 12px |
