# askJun — AI-Native Portfolio

A conversation-first AI portfolio website for Boh Ze Jun, Senior Frontend / Full Stack Software Engineer.

## Architecture

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + custom Glass Atelier design system
- **Animation:** Framer Motion (spring physics, staggered cascades)
- **Chat Engine:** Client-side keyword-matching AI simulation with streaming text
- **Deployment:** Manus hosting (static)

## Design Philosophy: Glass Atelier

- Deep navy background with warm orange + soft violet accent colors
- Glassmorphism cards with `backdrop-blur` and translucent borders
- Ambient gradient orbs with CSS keyframe animations
- Bento grid layout (asymmetric, responsive)
- Typography: Outfit (display/body) + Fira Code (monospace/technical)

## Features

- [x] Bento grid homepage with glass cards
- [x] AI chat panel with streaming text simulation
- [x] Tool-use simulation (document retrieval animation)
- [x] Experience timeline with expandable sections
- [x] Skills marquee + categorized tags
- [x] Impact metrics dashboard
- [x] Contact links (Email, LinkedIn, GitHub)
- [x] Singapore skyline footer
- [x] Responsive design (mobile FAB for chat)
- [x] Smooth entrance animations (staggered spring physics)
- [x] Dark theme optimized for recruiter viewing

## File Structure

```
client/src/
├── components/
│   ├── ChatCard.tsx       — Chat CTA bento tile
│   ├── ChatPanel.tsx      — Full chat overlay with streaming
│   ├── ContactCard.tsx    — Contact links tile
│   ├── ExperienceCard.tsx — Timeline with expandable entries
│   ├── HeroCard.tsx       — Main hero tile with profile
│   ├── HighlightsCard.tsx — Key metrics grid
│   ├── SkillsCard.tsx     — Skills marquee + categories
│   └── SkylineFooter.tsx  — Singapore skyline footer
├── data/
│   ├── chatEngine.ts      — AI response simulation engine
│   └── portfolio.ts       — All professional content/data
├── pages/
│   └── Home.tsx           — Main bento grid page
└── index.css              — Glass Atelier design tokens
```

## Content Source

All professional content is sourced from the latest CV (2026-04-28) and covers:
- Meta (Manus AI) — AI agent conversation interfaces
- Instawork — Cross-platform features, AI booking bot
- HoYoverse — Payment systems at massive scale ($57M, 8M DAU)
- TikTok/ByteDance — GDPR compliance, payments infrastructure
- Bank of Singapore — Innovation, RM tools, roboadvisory
- DBS Bank — Data science, graph theory

## Chat Knowledge Base

The AI chat covers topics including:
- AI/ML experience and agent interfaces
- Payment systems and fintech
- Technical stack and frameworks
- Career motivations and availability
- Specific company experiences
- Awards and recognition
- Education background
- Speaking engagements (SINFO 2024)
