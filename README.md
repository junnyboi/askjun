# askJun — AI-Native Portfolio

A conversation-first AI portfolio website for Boh Ze Jun, Senior Frontend / Full Stack Software Engineer. Built with the Nothing design philosophy — raw industrial minimalism, stark monochrome, and deliberate precision.

## Architecture

The site is a full-stack React application with a DeepSeek-powered AI chat backend.

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Nothing Design System |
| Animation | Framer Motion (viewport-triggered reveals) |
| Chat Backend | tRPC + DeepSeek via Forge API |
| Database | MySQL (TiDB) via Drizzle ORM |
| Deployment | Manus hosting |

## Design Philosophy: Nothing

The site follows Nothing's design language — the consumer electronics brand known for raw industrial minimalism. Key principles applied:

| Principle | Implementation |
|-----------|---------------|
| Monochrome palette | Black/white with Nothing Red (#E60000) accent |
| Typography hierarchy | Space Grotesk (display) + Inter (body) + Space Mono (technical) |
| Sharp geometry | 0-2px border radius, no rounded corners |
| No shadows | Thin 1px borders define hierarchy |
| Mechanical animation | Precise ease-out, never bouncy |
| Generous negative space | 8px grid, large section padding |
| Light/Dark mode | Full theme system with system preference detection |

## Features

The portfolio includes a real AI chat powered by DeepSeek, a comprehensive knowledge base covering all professional experience, project case studies with expandable details, a downloadable CV, and smooth viewport-triggered scroll animations. The theme toggle supports both light and dark modes with anti-flash initialization.

## File Structure

```
client/src/
├── components/
│   ├── nothing/           — Nothing-styled page sections
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── MetricsBar.tsx
│   │   ├── ExperienceSection.tsx
│   │   ├── SkillsSection.tsx
│   │   ├── CaseStudies.tsx
│   │   ├── ContactSection.tsx
│   │   ├── Footer.tsx
│   │   └── LoadingOverlay.tsx
│   ├── ChatPanel.tsx      — AI chat with Nothing aesthetic
│   └── ThemeToggle.tsx    — ●/○ theme switcher
├── data/
│   ├── chatEngine.ts      — Fallback keyword engine
│   └── portfolio.ts       — Professional content
├── pages/
│   └── Home.tsx           — Main page composing all sections
└── index.css              — Nothing design tokens (light + dark)

server/
├── knowledge.ts           — AI system prompt + knowledge base
├── routers.ts             — tRPC routes including chat.send
└── _core/                 — Framework plumbing (auth, LLM, storage)
```

## Content Source

All content sourced from the latest CV (2026-04-28) and LinkedIn profile, covering Meta (Manus AI), Instawork, HoYoverse, TikTok/ByteDance, Bank of Singapore, and DBS Bank.
