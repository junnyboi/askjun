# Projects Showcase — Implementation Plan

**Date:** May 2, 2026
**Author:** Manus AI

---

## 1. Overview

This plan details the implementation of a two-tier projects showcase in the "Browse traditionally" section of askJun. Each project card will feature genre/category tags that visually communicate the type of work, making it easy for recruiters to scan and identify relevant experience.

---

## 2. Project Data Structure

Each project will have the following fields:

```typescript
interface Project {
  title: string;          // Display name
  description: string;    // One-line description
  tags: string[];         // Genre/category tags (e.g., "AI", "Game Dev", "E-commerce")
  tech: string[];         // Tech stack tags
  link: string;           // URL (GitHub, live demo, or app store)
  linkLabel: string;      // "GitHub" | "Live Demo" | "App Store"
  visibility: "public" | "private";  // Show lock icon for private
  image?: string;         // Thumbnail URL (Tier 1 only)
}
```

---

## 3. Genre/Category Tag System

Tags will be color-coded using the Nothing palette (monochrome base with accent highlights). Each genre gets a distinct but subtle visual treatment:

| Genre Tag | Color Treatment | Used For |
|-----------|----------------|----------|
| `AI` | Red accent border (`border-accent`) | Manus AI, askJun, deepforge |
| `Game Dev` | Default border | mandaismoker, teapets-3d, Gobbo |
| `Productivity` | Default border | Trident, Trident Mobile |
| `E-commerce` | Default border | mijun |
| `Mobile` | Default border | tony-stocks, Trident Mobile |
| `Automation` | Default border | booking-bot |
| `Creative` | Default border | polygen, housewarmer |
| `Native App` | Default border | Trident (Swift), Trident Mobile (Kotlin) |
| `Web3` | Default border | IsleProjectNFT |
| `IoT` | Default border | Home Assistant |

All tags use the same Nothing-style treatment: `text-[9px] font-mono px-1.5 py-0.5 border border-border rounded`. The `AI` tag gets a special accent treatment to draw attention to AI-related work (since that's Jun's primary positioning).

---

## 4. Tier 1: Featured Projects (with thumbnails)

These are the four showcase projects displayed as larger cards with generated thumbnail images in a 2x2 grid:

| Project | Title | Description | Tags | Tech | Link |
|---------|-------|-------------|------|------|------|
| **Trident** | Trident | Swiss Army Knife for macOS productivity | `Productivity` `Native App` | Swift · macOS · AppKit | GitHub (private) |
| **mandaismoker** | Mandai Smoke Co. | Idle tycoon game — build your BBQ empire | `Game Dev` | TypeScript · PixiJS | GitHub (private) |
| **mijun** | Mijun | Cinematic tea & preserved flower e-commerce | `E-commerce` `Creative` | TypeScript · React | GitHub (private) |
| **askJun** | askJun AI Portfolio | This site — chat-first AI portfolio powered by DeepSeek | `AI` `Web` | React · TypeScript · DeepSeek | Live (self-link) |

Each Tier 1 card will have: thumbnail image (16:9), title, description, genre tags, tech tags, and a link with visibility badge.

---

## 5. Tier 2: Side Projects (text-only cards)

Smaller, text-only cards in a responsive grid:

| Project | Title | Description | Tags | Link |
|---------|-------|-------------|------|------|
| **teapets-3d** | TeaPets 3D | Browser-based roguelike with cute slime character | `Game Dev` | GitHub (private) |
| **housewarmer** | Housewarmer | Scroll-animated housewarming invitation | `Creative` `Web` | GitHub (private) |
| **booking-bot** | Booking Bot | Automated booking system | `Automation` | GitHub (private) |
| **polygen** | Polygen | Procedurally generated low poly asset collection | `Creative` `Game Dev` | GitHub (private) |
| **Gobbo-2D** | Gobbo 2D | Unity 2D game — a couple's passion project | `Game Dev` | GitHub (public) |
| **tony-stocks** | Finance Tracker | Ionic + React mobile finance app | `Mobile` `Finance` | GitHub (public) |

---

## 6. Implementation Steps

### Step 1: Generate Thumbnail Images for Tier 1

Generate 4 new thumbnails matching the Nothing aesthetic for: Trident, mandaismoker, mijun, and askJun. These replace the current professional project thumbnails (Manus AI, HoYoverse, TikTok, Bank of Singapore) which move to the "Professional Experience" context in the chat knowledge base.

### Step 2: Create Project Data File

Create `client/src/data/projects.ts` with all project data structured per the interface above.

### Step 3: Update the Browse Traditionally Section

Replace the current inline project arrays in Home.tsx with imports from the new data file. Render Tier 1 as a 2x2 thumbnail grid and Tier 2 as a compact text-only grid below it.

### Step 4: Implement Genre Tag Component

Create a reusable `<Tag>` component that renders genre/category tags with the appropriate styling. The `AI` tag gets the accent treatment.

### Step 5: Add Visibility Badges

Private repos show a small lock icon (🔒) next to the link. Public repos show a small external link icon (↗).

---

## 7. Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Featured Projects                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  [Thumbnail]        │  │  [Thumbnail]        │      │
│  │  Trident            │  │  Mandai Smoke Co.   │      │
│  │  Productivity · App │  │  Game Dev           │      │
│  │  Swift · macOS      │  │  TypeScript · PixiJS│      │
│  │  🔒 GitHub          │  │  🔒 GitHub          │      │
│  └─────────────────────┘  └─────────────────────┘      │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  [Thumbnail]        │  │  [Thumbnail]        │      │
│  │  Mijun              │  │  askJun AI Portfolio │      │
│  │  E-commerce         │  │  AI · Web           │      │
│  │  TypeScript · React │  │  React · DeepSeek   │      │
│  │  🔒 GitHub          │  │  ↗ Live Demo        │      │
│  └─────────────────────┘  └─────────────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Side Projects                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ TeaPets  │ │Housewarm │ │BookingBot│ │ Polygen  │  │
│  │ Game Dev │ │ Creative │ │Automation│ │ Creative │  │
│  │ 🔒       │ │ 🔒       │ │ 🔒       │ │ 🔒       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐                              │
│  │ Gobbo 2D │ │ Finance  │                              │
│  │ Game Dev │ │ Mobile   │                              │
│  │ ↗        │ │ ↗        │                              │
│  └──────────┘ └──────────┘                              │
└─────────────────────────────────────────────────────────┘
```
