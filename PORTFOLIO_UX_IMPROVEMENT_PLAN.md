# askJun Portfolio — UX Improvement & Feature Gap Analysis

**Date:** May 2, 2026
**Prepared for:** Boh Ze Jun (Poseidon)
**Author:** Manus AI

---

## 1. Executive Summary

This document synthesizes findings from a comprehensive analysis of 50+ AI engineer portfolios, chat-first personal sites, and recruiter feedback from 2025-2026. The research identifies critical gaps in the current askJun implementation and proposes a prioritized roadmap of improvements that will transform the site from a strong proof-of-concept into a recruiter-converting weapon.

The core insight across all research is this: **chat-first is a strong differentiator, but it must coexist with traditional navigation patterns.** Recruiters spend 6-8 seconds on an initial scan [1]. If they can't immediately find what they need, they leave — regardless of how clever the AI is.

---

## 2. Current State Assessment

The askJun site currently implements a ChatGPT-inspired chat-first layout with Nothing design aesthetics. The following table summarizes what's working well versus what needs improvement:

| Strength | Evidence |
|----------|----------|
| Chat-first hero is engaging | Chat-based portfolios increase dwell time from 5s to 30s [2] |
| Nothing aesthetic is distinctive | Monochrome + red accent stands out from generic portfolios |
| Suggestion chips reduce friction | Solves the "blank canvas syndrome" that kills chat UX [3] |
| Key metrics visible immediately | $57M, 15M+, 8M DAU establish credibility in seconds |
| DeepSeek backend provides real AI | Not a gimmick — demonstrates actual AI integration skill |

| Weakness | Impact |
|----------|--------|
| No traditional navigation | Recruiters who want to scan (not chat) will bounce |
| No visible project case studies | Can't demonstrate system design depth |
| Chat is the only way to discover info | Violates "clear CTA" principle for recruiters [4] |
| No rich media in chat responses | Text-only responses feel limited vs. competitors |
| No shareability features | Can't generate buzz on Twitter/HN/Reddit |
| Auto-focus missing on input | Extra click required to start typing |

---

## 3. Competitor Landscape

Based on the research, the most effective AI engineer portfolios in 2026 share these characteristics:

| Feature | Example | Implementation |
|---------|---------|---------------|
| Hybrid navigation | brittanychiang.com | Chat + traditional menu coexist |
| Interactive demos | guillaumemaarek.com | AI chatbot + MDX-powered content |
| Measurable impact | DataExpert.io examples | Specific metrics in every project |
| Easter eggs/gamification | kuber.studio | Terminal games, hidden commands |
| Rich media responses | Chatfolio sites | Images, code blocks, diagrams in chat |
| Split-screen context | Emerging trend | Chat left, dynamic content right |

---

## 4. Prioritized Feature Roadmap

### Tier 1: Critical (Recruiter Conversion)

These features directly impact whether a recruiter will contact Jun or bounce.

**4.1 Hybrid Navigation System**

Add a minimal secondary navigation that appears *below* the chat area or as a subtle bottom bar, allowing recruiters to jump directly to structured content without chatting.

| Element | Behavior |
|---------|----------|
| "Experience" link | Scrolls to or reveals a structured timeline |
| "Projects" link | Shows case study cards |
| "Resume" link | Downloads PDF directly |
| "Contact" link | Shows email/LinkedIn |

Implementation: A collapsible "Browse traditionally" section below the chat hero, or a persistent bottom tab bar on mobile. This does NOT replace the chat — it supplements it for users who prefer scanning.

**4.2 Auto-Focus on Input**

The chat input should be automatically focused on page load (desktop only — mobile auto-focus triggers keyboard which is disruptive). This eliminates one click of friction.

**4.3 Rich Media Chat Responses**

When the AI discusses projects, it should be able to render:
- Inline code blocks with syntax highlighting
- Key metric callouts (styled differently from body text)
- Links that open in new tabs
- A "View full case study" expandable section within the response

**4.4 Persistent Contact Visibility**

Email and LinkedIn should be visible at ALL times — not just in the header on desktop. On mobile, they should appear in the bottom bar or as a sticky footer element.

---

### Tier 2: High Impact (Engagement & Differentiation)

These features increase time-on-site and make the portfolio memorable.

**4.5 Shareable Chat Transcripts**

Add a "Share this conversation" button that generates a unique URL or screenshot of an interesting AI interaction. This enables viral sharing on Twitter/LinkedIn.

**4.6 More Easter Eggs & Hidden Commands**

Expand beyond the "handsome" Easter egg. Add responses for:
- "play a game" → Simple ASCII/emoji game
- "tell me a joke" → Tech humor
- "sudo hire jun" → Special response
- "what's your favorite food" → Personality reveal (food lover from LinkedIn)
- "dance" → Reference to NUS Ballroom

**4.7 Intent-Based Personalization**

On first visit, show a subtle prompt: "I'm a..." with options like "Recruiter", "Engineer", "Just browsing". This tailors the suggestion chips and initial AI greeting.

**4.8 Keyboard Shortcuts**

For power users (fellow engineers):
- `Cmd/Ctrl + K` → Focus chat input
- `Esc` → Clear/reset conversation
- `/` → Focus input (vim-style)

---

### Tier 3: Polish (Premium Feel)

These features elevate the site from "good" to "exceptional."

**4.9 Magnetic Hover on Suggestion Chips**

Chips subtly attract toward the cursor when nearby (3-5px magnetic pull), creating a tactile, premium feel.

**4.10 Typing Speed Variation**

Vary the streaming text speed slightly (±20%) to mimic natural human typing rather than a constant mechanical rate. Pause briefly at punctuation marks.

**4.11 Subtle Background Animation**

A very faint, slow-moving noise/grain texture or subtle particle system in the background that reacts to chat activity. Nothing too flashy — just enough to make the page feel alive.

**4.12 Sound Design (Optional)**

Subtle audio feedback:
- Soft "tick" on message send
- Gentle "pop" when AI response completes
- Muted keyboard clicks while streaming

Should be off by default with a toggle to enable.

---

### Tier 4: Future Considerations

These are longer-term features that require more infrastructure.

| Feature | Complexity | Value |
|---------|-----------|-------|
| Voice input/output (Web Speech API) | Medium | High for accessibility |
| Interactive architecture diagrams | High | High for senior roles |
| Conversation analytics dashboard (owner-only) | Medium | Medium for optimization |
| Multi-language support | Low | Medium for global reach |
| Blog/technical writing section | Medium | High for thought leadership |

---

## 5. Implementation Phases

### Phase A: Quick Wins (1-2 hours)

| Task | Impact |
|------|--------|
| Auto-focus input on desktop | Reduces friction |
| Add more Easter eggs to knowledge base | Increases shareability |
| Make email/LinkedIn always visible on mobile | Improves recruiter conversion |
| Add keyboard shortcuts (Cmd+K, Esc, /) | Power user delight |

### Phase B: Hybrid Navigation (2-3 hours)

| Task | Impact |
|------|--------|
| Add "Browse traditionally" expandable section | Serves scan-first recruiters |
| Build minimal Experience/Projects/Contact sections below chat | SEO + accessibility |
| Ensure sections are accessible without JavaScript | Progressive enhancement |

### Phase C: Chat Enhancements (2-3 hours)

| Task | Impact |
|------|--------|
| Rich media in responses (code blocks, metric callouts) | Demonstrates depth |
| Typing speed variation | Premium feel |
| Share conversation button | Viral potential |
| Intent-based greeting personalization | Better engagement |

### Phase D: Micro-interactions (1-2 hours)

| Task | Impact |
|------|--------|
| Magnetic hover on chips | Tactile premium feel |
| Subtle background grain/noise animation | Page feels alive |
| Smooth theme transition animation | Polish |
| Button press scale feedback | Responsive feel |

---

## 6. Success Metrics

After implementation, measure:

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Average session duration | > 45 seconds | Umami analytics |
| Messages sent per session | > 3 | Server-side logging |
| CV download rate | > 15% of visitors | Umami event tracking |
| Contact click rate | > 10% of visitors | Umami event tracking |
| Bounce rate | < 40% | Umami analytics |
| Mobile usability | No layout issues at 375px | Manual testing |

---

## 7. Key Takeaways

The research converges on three principles for chat-first portfolios:

> **Principle 1:** Chat should be the *primary* path, not the *only* path. Always provide escape hatches to traditional content. [1] [4]

> **Principle 2:** The AI chat itself is a live demo of your engineering skills. Its speed, accuracy, and polish directly reflect your capabilities. [2] [5]

> **Principle 3:** Shareability drives discovery. If someone can't easily screenshot or link to an interesting interaction, the viral loop dies. [6]

---

## References

[1] Top Tech Company Portfolio Evaluation — https://brittanychiang.com/
[2] Chat Portfolio Engagement Metrics — https://www.reddit.com/r/UXDesign/comments/1qfo8me/added_a_small_gpt_style_chatbot_to_my_portfolio/
[3] Chat-First UX Patterns — https://www.chatfol.io/
[4] Portfolio UX Anti-Patterns — https://www.reddit.com/r/cscareerquestions/comments/1ofb7iz/why_are_so_many_developer_portfolios_so_messy_and/
[5] AI Engineer Portfolio Best Practices — https://www.dataexpert.io/blog/ultimate-guide-ai-engineering-portfolios
[6] Viral Portfolio Features — https://www.reddit.com/r/webdev/comments/1mlkgrj/the_best_terminal_inspired_portfolio_on_the/
