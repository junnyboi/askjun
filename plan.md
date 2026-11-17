# askJun UI Overhaul: Direction B (Split Dossier)

Date: 17 Nov 2026. Baseline: `2d41eab`. Source proposal: `docs/REDESIGN_PROPOSALS.md`. Status: **built**; outcomes are ticked in `todo.md`.

## Understanding

Jun chose **Direction B** with the shared conversation and mobile views, asked for **all direction-independent quick fixes**, and approved the **lighter dark-mode red**.

Two proposal decisions are still unanswered, so they are **not** part of this build:

- GitHub link target (`PROFILE.github` stays as it is).
- Source chips under answers (no backend change, no chip in the UI).

Non-goals: no change to chat safety guards, retrieval, the model chain, the CV file, the admin page, or the OG image. No new fonts. No publishing; the checkpoint is saved and Jun publishes when he has seen it.

## Design

The existing Nothing-style system is reused: white / black / grey, one red accent, Space Grotesk (headings), Inter (body), Space Mono (labels and numbers). Light is the default theme.

- **Layout paradigm:** two panes from 1024 px up. Left: a fixed dossier (portrait, title, four metrics, six-employer timeline, Download CV, contact links). Right: the chat. Below 1024 px the dossier folds into the chat's first screen (mockup F) and the CV button moves to a bottom bar.
- **Signature elements:** the red square that marks askJun's answers; mono metric tiles; the dotted employer timeline with the current role in red.
- **Interaction:** every metric tile and employer row is a prompt. Clicking it asks the question.
- **Motion:** unchanged; existing fades and the typing bars. Nothing new that animates layout.
- **Voice:** short and factual. "Ask anything about Jun." / "Answers come from his CV and portfolio."

### Tokens

| Token | Before | After | Why |
|---|---|---|---|
| `--card`, `--secondary`, `--sidebar` (light) | `#F7F7F5` | `#F9F9F7` | Red on the grey surface goes from 4.49 to 4.56, passing AA |
| `--accent`, `--ring`, `--destructive`, `--chart-4`, `--sidebar-ring` (dark) | `#E60000` | `#FF4D4D` | 6.05 on `#0A0A0A`, 5.63 on `#141414` (was 4.11 / 3.83) |
| `--accent-foreground`, `--destructive-foreground` (dark) | `#FFFFFF` | `#0A0A0A` | White on `#FF4D4D` is only 3.27; near-black is 6.05 |
| `.chat-text` | 14 px | 16 px | Larger reading text in the conversation |
| `.scaled-xs / -sm / -body / -heading / -lg` | 10 / 12 / 11 / 14 / 18 px | 12 / 14 / 16 / 18 / 28 px | 12 px floor; portfolio body matches chat body |

Rules: no text below 12 px on public pages; no opacity modifiers on text colours; text on the accent uses `text-accent-foreground`, never `text-white`.

## Project structure

```
client/public/avatar/            jun-96/320/640/960.webp (studio portrait, replaces the 3.85 MB PNG)
client/public/manus-routes.json  page route manifest
client/src/data/portfolio.ts     + PROMPT_CARDS, askPrompt per employer, prompt per metric
client/src/lib/clipboard.ts      copy helper with insecure-context fallback
client/src/components/
  Wordmark.tsx                   askJun logotype link
  AskInput.tsx                   textarea + mic + send; hero and docked variants
  PromptChip.tsx                 pill prompt button
  MetricTile.tsx                 metric + label; static or clickable
  EmployerTimeline.tsx           six employers, each a prompt
  DownloadCVLink.tsx             the one CV link; primary / outline / icon
  DossierPane.tsx                desktop left pane
  NewChatDialog.tsx              confirmation before clearing the chat
  chat/ChatTopBar.tsx            identity (mobile), New chat, Portfolio, Aa, theme
  chat/ChatEmptyState.tsx        headline, input, prompt cards, mobile proof
  chat/ChatMessage.tsx           one message with its action row
  chat/ChatFollowUps.tsx         suggested follow-ups
client/src/pages/Home.tsx        layout + scroll and keyboard behaviour only
client/src/pages/Portfolio.tsx   reworked page (same data, same sections)
server/knowledge/keywordRouter.ts  two copy fixes + one routing fix (below)
```

`useChatEngine`, `chatStream.ts`, guards and retrieval are untouched.

## Phases

**Phase 0, quick fixes**

1. Avatar: square studio crop exported as 96 / 320 / 640 / 960 px WebP in `client/public/avatar/`, served as `image/webp` by the app itself. Removes the 3.85 MB PNG request and the second, different portrait from the first screen.
2. Contrast: token changes above; remove opacity on text; `text-white` on accent becomes `text-accent-foreground`.
3. Text size: 12 px floor in Home, Portfolio, generative cards, font toggle.
4. One name: "Portfolio" everywhere (was also "Experience & Projects").
5. Escape, the logo and a new "New chat" button all go through one confirmation dialog. The logo no longer clears the chat.
6. Model names out of the public UI: retrieval badges and tooltip, footer "gpt-4", portfolio project card (its tech tag now reads "RAG"). The deterministic "what is askJun" answer also named GPT-4.1-mini; only the model name was removed from it.

**Phase 1, foundations:** the shared components listed above.

**Phase 2, home:** `DossierPane` + `ChatEmptyState` at 1024 px and up.

**Phase 3, conversation:** 720 px reading column, user bubble, red-square label, one labelled action row (Copy, Regenerate, Share, Stop), follow-up chips, docked input.

**Phase 4, portfolio page:** studio avatar, four large metric tiles, roles showing two bullets with "Show all", skills grouped by category, Game Dev and Side Projects collapsed by default, contents links open a collapsed section.

**Phase 5, mobile and release:** mockup F layout below 1024 px, light and dark checks, `pnpm check`, `pnpm test`, checkpoint, GitHub push.

## Data flow

Dossier tile or row click, prompt card, chip and typed input all call the existing `handleSend(text)`. Nothing else about the chat pipeline changes.

## Routing fix found while testing prompts

"What did he do at Bank of Singapore?" returns the **location** answer, because the location route matches the word "singapore". The employer row for Bank of Singapore would hit this. Fix: the employer name is neutralised before keyword matching, with a test.

## Preflight risk checklist

- Logic: Escape must not reopen the dialog it just closed, and must close the portrait zoom first. Handled with refs read inside the key handler.
- Security: external links keep `rel="noopener noreferrer"`; no new HTML injection; clipboard keeps its fallback.
- Architecture: chat state stays in `useChatEngine`; new components are presentational.
- Structure: one component per file; no barrels added.
- React: one input mounted at a time so focus shortcuts keep a single target.
- i18n: not applicable, the site is English only.
- Responsive UI: `min-w-0` down the pane chain; max-width and padding on separate layers; dossier scrolls on short viewports.
- Reviewability: `Home.tsx` shrinks from 726 lines to an orchestrator.

## Verification

- `pnpm check` and `pnpm test`.
- Screenshots: home and portfolio at 1280 x 720, 1024 x 768 and 375 x 812.
- Browser pass: ask a question, check the conversation view, the New chat dialog, Escape, and dark mode.
- `curl` the avatar for `image/webp` and size; re-run the Bank of Singapore prompt.
