# askJun E2E test report (20–21 Nov 2026)

Request: "conduct E2E testing of the revamped site and fix all bugs discovered."

## Result

| Run | Before (live commit `e3b5bcd`) | After (this commit) |
| --- | --- | --- |
| Chromium, 78 tests (UI, API, static files) | 54 passed, 24 failed | 78 passed |
| WebKit and Firefox, 57 UI tests each | not run | 114 passed |
| Real backend, 3 tests (real model, real knowledge base) | 1 passed, 2 failed | 3 passed |
| Unit tests (`pnpm test`) | 8 | 30 passed |

Both columns come from the same suite. "Before" is a production build of the commit that was live on askjun.org; "after" is a production build of the fixed code. 20 bugs were confirmed in the live version and fixed. Eight further findings are not bugs I could fix on my own authority; they are listed under "Decisions for Jun".

## Method

The suite is in `tests/e2e/` (Playwright for Python; `harness.py`, `specs.py`, `run.py`). It starts a local production build and drives it in a real browser.

- **No production data is touched.** The project's database is shared between development and production, so the test server is started without a database, and analytics calls are intercepted in the page. The `api` group must never be run against askjun.org: it sends malformed requests and exhausts the rate limit on purpose.
- **Chat answers are scripted in the page** for the UI tests, so each test controls timing, errors and content exactly. The three `real` tests use the real server, knowledge base and model.
- **Viewports and themes:** desktop 1440px, laptop 1024px, phone 375px, small phone 320px; light and dark.
- **Accessibility:** axe-core, WCAG 2.2 AA, 11 scans (Home, conversation, New chat dialog, Portfolio; light, dark, phone). No serious findings before or after. These scans ran in Chromium only.

Run it:

```sh
pnpm build
python3 tests/e2e/run.py --managed . --port 3200 --browsers chromium --groups ui,api,static
python3 tests/e2e/run.py --managed . --port 3210 --browsers webkit,firefox --groups ui
python3 tests/e2e/run.py --managed . --port 3230 --browsers chromium --groups real
```

### Coverage

| Area | IDs | What is checked |
| --- | --- | --- |
| Home | H01–H12 | Dossier, prompt cards, chips, typing and shortcuts, theme, portrait, phone and laptop widths, loading indicator |
| Conversation | C01–C29 | Streaming, Stop, Regenerate, Copy, Share, New chat, Escape, follow-up chips, answer cards, replaced answers, rate limit, errors, offline answers, link safety, scroll position, font size, tooltips |
| CV | V01–V03 | Download on desktop and phone, failure message |
| Portfolio | P01–P08 | Sections, Show all, contents list, links, phone menu, header |
| Navigation | N01–N02 | Not-found page, direct links |
| Admin | A01–A02 | Password gate, no default password |
| Accessibility | Y01–Y14 | axe scans, keyboard, headings, tab titles |
| API | X01–X04 | Malformed requests, guards, rate limit, missing database |
| Static files | S01–S04 | File types, share card, sitemap, links the assistant hands out |
| Real backend | R01–R03 | Grounded answer, wrong-employer correction, streaming |

## Bugs found in the live version and fixed

### High

| # | Bug | Evidence (before) | Fix |
| --- | --- | --- | --- |
| 1 | The published site answered model questions with no knowledge base and no guardrail prompt. The production bundle could not find `server/knowledge/*.md`. | R01, R03 fail on the live build. On askjun.org (19 Nov), "What did he build at Instawork?" was answered about Instawork's founders. | Build copies the files to `dist/knowledge`; the server never calls the model without the system prompt and points to Jun's email instead. |
| 2 | One malformed chat request stopped the server process. | X01: `{"messages":[{"role":"user"}]}` took the server down. | Requests are validated (`server/chatMessages.ts`); the handler catches errors. Bad requests get a 400. |
| 3 | The chat accepted a caller-supplied `system` message and obeyed it. | X01: the model answered in a pirate voice. | Only user and assistant text turns are accepted. |
| 4 | The admin password had a default, `mijun`, hard-coded in a public repository, and askjun.org accepted it. | A02; `admin.verify` on the live site returned `valid: true`. | No default. The dashboard stays locked until `ADMIN_PASSWORD` is set. |
| 5 | All visitors shared one 30-questions-an-hour allowance, because the limit was keyed on the proxy's address. | X03: a second visitor got 429 after the first used the allowance. | Visitor address is read from `cf-connecting-ip` / `x-forwarded-for`. One limiter (`server/chatRateLimit.ts`) serves both chat endpoints and adds a site-wide ceiling of 300 model answers an hour, since those headers can be forged. |

### Medium

| # | Bug | Evidence (before) | Fix |
| --- | --- | --- | --- |
| 6 | Regenerating an earlier answer moved it to the end and sent the wrong history. | C05: order became user, user, assistant, assistant. | The answer is replaced in place. |
| 7 | Raw HTML in an answer was rendered. | C21: `<img onerror>` raised React error #231; iframes and inline styles rendered. | `ChatMarkdown.tsx` renders markdown only; only web and email links are clickable. |
| 8 | Failures left the visitor guessing: a rate limit showed "Something went wrong."; a stream error, an empty reply or Stop before the first word left a blank answer; an error part-way looked like a finished answer. | C17, C18, C19, C29. | Each case now shows a specific message; a cut-off answer says so and offers Regenerate. |
| 9 | A new answer was not brought to the top of the view from the second exchange on (about 525px short), and never for instant answers. | C22, C28. | The newest answer reserves the height of the pane; the scroll follows the newest answer rather than the streaming state. |
| 10 | On Portfolio, the contents list and the phone section menu opened a closed section but did not scroll to it. | P03, P05, P06. | The jump waits for the section to finish opening; choosing another section cancels it (P08). |
| 11 | 12 links on Portfolio returned 404 to visitors: 8 private repositories (swipe, trident, trident-mobile, mijun, housewarmer, IsleProjectNFT, booking-bot, polygen) and 4 offline demos (swipe.manus.space, teapets.mircovm.com, teapets-3d.mircovm.com, aegis-td.manus.space). 6 of the 14 links the assistant hands out were among them. | P04, S04. | Cards link only where a working link exists; private projects are labelled "Private repo". The dead links are removed from the canned GitHub answer and the knowledge files. |
| 12 | The built-in answers used when the server is unreachable contradicted Jun's instructions: roles sought, pay speculation ("FAANG… calibrated"), and skills not on the CV. | C20. | Those three answers now match the online ones. |

### Low

| # | Bug | Evidence (before) | Fix |
| --- | --- | --- | --- |
| 13 | Prompts clicked while an answer was streaming were ignored but still counted as chip clicks. | C24. | Not counted. |
| 14 | The not-found page was the starter template: blue button, light card in dark mode. | N01. | Restyled with the site's tokens; same wording. |
| 15 | Every page had the same browser tab title. | Y14. | Home, Portfolio, Admin and not-found each have their own. |
| 16 | The phone conversation view had no page heading. | Y13. | Added to the top bar. |
| 17 | The page was blank while the 1.95 MB bundle loaded. | H12. | A spinner is in `index.html` until the app mounts. |
| 18 | The share card was a 2.9 MB PNG behind a temporary redirect, served as `application/octet-stream`, with the wrong declared size. | S02. | `/og-card.jpg`: the same approved artwork at 1200×675, 75 KB. |
| 19 | The sitemap listed `/admin`. | S03. | The site supplies its own sitemap with `/` and `/portfolio`. |
| 20 | Every model question first made an embeddings call that always fails on this platform (about 0.7s). | Server log: "Embedding API error: 404". | The call is skipped when no knowledge chunk has an embedding. |

## Independent review

A separate reviewer read the fixes. It found no critical problems and ten smaller ones; all were addressed except where noted here.

- The site-wide ceiling did not cover the second chat endpoint (tRPC `chat.send`). Fixed: one shared limiter, and both endpoints validate requests the same way.
- A late reply from a stopped or superseded request could alter the next one. Fixed: each request carries a generation number. This also fixed a Firefox failure where an answer kept growing after Stop.
- Instant answers did not scroll, the Portfolio jump could go stale, and a part-way error looked complete. Fixed (C28, P08, C29).
- **Reverted on purpose:** using the visitor's real address for analytics. That would have started storing real visitor IP addresses and sending them to ip-api.com over plain HTTP. Analytics keeps its previous behaviour; see decision 3.
- Left as is: the `retrievalType` field and `meta` event are still sent and no longer read by the page.

## Decisions for Jun

1. **Admin password.** `/admin` is locked until `ADMIN_PASSWORD` is set as a project secret. Do not reuse `mijun`: it is in the public repository's history.
2. **Private repositories and offline demos.** The 12 dead links are gone; the projects are still shown. If a repository is made public or a demo is brought back, the link can be restored in `client/src/data/projects.ts`.
3. **Visitor analytics is not counting visitors.** Every visitor is recorded under an internal proxy address: 11 "visitors", 765 visits, 0 countries. Counting real visitors means storing their IP addresses and sending them to ip-api.com over plain HTTP. Not changed.
4. **The model is not the one the code asks for.** The code requests gpt-4.1-mini, then gpt-4o-mini, then deepseek-chat. The platform has none of them and serves all three names with gemini-3.5-flash-lite. gpt-5-mini is available and answers as itself. Switching changes every answer and would need the stress tests re-run. Not changed.
5. **Semantic retrieval does not run.** The platform has no embeddings model, so answers always use the keyword-scored context.
6. **The site-wide ceiling of 300 model answers an hour** is my choice of value.
7. **Claims not on the CV remain** in the built-in offline answers ("$125M revenue run rate"; games that "went viral internally", also in `server/knowledge/projects-games.md`).
8. **Fonts.** Google's stylesheet loads on every visit, not only as a fallback, and Chromium takes Inter from Google rather than from the self-hosted file.

## Not tested

- Voice input (needs a microphone).
- Real iOS and Android devices; phone widths were emulated on desktop browsers.
- Performance (Lighthouse) and load.
- The admin dashboard after sign-in: it would read production data.
- Rate limiting and malformed requests against askjun.org itself.
- Accessibility scans in WebKit and Firefox.
