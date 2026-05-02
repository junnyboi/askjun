# GitHub Projects — Summary & Display Strategy for askJun

**Date:** May 2, 2026
**Author:** Manus AI

---

## 1. Repository Summary

The following table consolidates all discoverable repositories under the `junnyboi` GitHub account. Note that private repositories could not be accessed without authentication in this session.

| Repository | Visibility | Language | Description | Last Updated | Commits | Status |
|-----------|-----------|----------|-------------|-------------|---------|--------|
| **operating-system** | Public (Fork) | Python | Fork of Home Assistant OS — smart home automation | Apr 2026 | N/A (fork) | Active |
| **tony-stocks** | Public (Archived) | JavaScript (71%), TypeScript (22%), CSS (5%) | "Jun's Finance Mobile App" — Ionic + React mobile app with Firebase backend for stock/finance tracking | Apr 2021 | 12 | Archived Feb 2026 |
| **Gobbo-2D** | Public | C# (95%), HLSL (4%), ShaderLab (2%) | "A Couple's Passion Project" — Unity 2D game with dynamic avatars, movable UI, follow cam, Cinemachine | Nov 2020 | 13 | Inactive |
| *Private repos* | Private | Unknown | Cannot access without GitHub authentication | Unknown | Unknown | Unknown |

---

## 2. Analysis

The public repositories reveal three dimensions of Jun's personality beyond his professional work:

**tony-stocks** demonstrates full-stack mobile development skills (Ionic, React, Firebase, Capacitor for Android deployment) and an interest in personal finance. This was built during his Bank of Singapore / early TikTok era (2021), showing initiative to build tools for personal use.

**Gobbo-2D** reveals a creative, game-development side — a Unity 2D game built as a couple's passion project. The commit messages ("Gobbo Big Release — dynamic avatar, movable UI box for characters, follow cam") show genuine game development skills in C#, HLSL shaders, and Cinemachine. This humanizes Jun beyond "just another engineer."

**operating-system** (Home Assistant fork) shows he's a smart-home enthusiast who tinkers with IoT — a signal of curiosity and hands-on technical breadth.

---

## 3. Display Strategy for askJun

### Recommended Approach: Hybrid Professional + Personal

The projects grid on askJun should showcase **two tiers** of projects:

**Tier 1 — Professional Work (already implemented):** The four project cards currently on the site (Manus AI, HoYoverse Payments, TikTok GDPR, Bank of Singapore Innovation) represent Jun's professional impact. These should remain the primary showcase.

**Tier 2 — Personal/Side Projects (new):** Add a secondary "Side Projects" row below the professional grid. This serves two purposes: it humanizes Jun (recruiters love seeing passion projects) and demonstrates breadth beyond the day job.

### Proposed Side Projects Section

| Project | Display Name | Description | Link | Why Include |
|---------|-------------|-------------|------|-------------|
| tony-stocks | Finance Tracker | Ionic + React mobile app for personal stock tracking with Firebase backend | GitHub repo | Shows full-stack mobile skills + financial domain interest |
| Gobbo-2D | Gobbo (2D Game) | Unity passion project — 2D game with dynamic avatars, follow cam, and custom shaders | GitHub repo | Shows creativity, C#/Unity skills, and personality |
| askJun | This Portfolio | Chat-first AI portfolio powered by DeepSeek, built with React + TypeScript + Tailwind | Self-referential link | Meta-flex: the portfolio itself is a project |
| Home Assistant | Smart Home Setup | Fork of Home Assistant OS for personal IoT automation | GitHub repo | Shows curiosity and hardware/IoT interest |

### Layout Recommendation

The "Browse traditionally" section should display projects in this order:

1. **Professional Projects** (existing 2x2 grid with thumbnails) — "Key Projects"
2. **Side Projects** (new 1x4 horizontal row, smaller cards, no thumbnails) — "Side Projects & Open Source"
3. Each side project card: title, one-line description, tech tag, and GitHub link icon

The side projects should be visually lighter than the professional ones — smaller cards, no thumbnail images, just text + tech badges + GitHub link. This creates a clear hierarchy: professional work is the main event, side projects are the encore.

### Implementation Details

The side project cards should use the existing Nothing design language: monochrome borders, Space Mono for tech tags, accent color on hover. Each card links directly to the GitHub repository. The "askJun" card links to the live site itself (self-referential).

A "View source on GitHub" link in the header should point to the askJun repo once it's pushed to GitHub, serving as the ultimate "View Source" meta-flex.

---

## 4. Regarding Private Repositories

To access private repos, Jun would need to either:
1. Log into GitHub in the browser (GeeTest CAPTCHA blocked automated login previously)
2. Provide a GitHub personal access token for `gh` CLI authentication
3. Manually share the names/descriptions of private repos he wants showcased

If there are significant private projects (e.g., freelance work, internal tools, hackathon projects), they could be added as "Private" cards with descriptions but no links, using a lock icon to indicate restricted access.
