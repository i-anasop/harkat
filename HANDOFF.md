# Harkat — handoff

This file is the whole context. A future developer or AI should be able to continue Harkat from this document and the repo, with nothing else.

Last updated: 26 Nov 2026, before the mobile pass and the prompt-home rebuild. Update this file whenever routes, prices, env vars, or the engine contract change.

Owner: Momin (Anas). GitHub: `i-anasop/harkat` is the live repo. He works on **`main` only**. Commit and push straight to `main`. Do not open feature branches or pull requests for this repo.

Contact on the site: `reach.harkat@gmail.com`. X: https://x.com/harkatai. LinkedIn: https://www.linkedin.com/company/harkatai.

---

## What Harkat is

Harkat AI makes cheap, agency-quality **2D motion-graphics launch films** for AI and SaaS startups. The films are built with code (HTML that draws a frame at time `t`), not with a video model and not by an LLM writing animation.

Two products share one site today:

1. **The engine (Studio).** A short brief becomes a sample film in the browser. Rules pick the scenes. An optional cheap LLM may only return a scene plan (~$0.0002 per film). A person still finishes any film a client pays for. The pictures are templates, not finished agency work.
2. **The studio service.** A client orders a film a person makes. Live prices are **Spark $30**, **Launch $50**, **Studio $100**. Older founding notes in `docs/04_OFFER_AND_BUSINESS.md` list $250 / $600 / $1,200. Those were **not** put on the site. Do not change the live prices unless Momin says so.

Tagline: *Your motion team, without the agency.*
Hero line in the brand kit: *Product films that move.*

The public proof is the Pond AI work (14+ films, 30–40s typical, zero music tracks). Pond’s CEO approved showing those films. They appear only when `NEXT_PUBLIC_SHOW_POND_WORK=true`.

---

## Brand and hard rules

These are non-negotiable. They apply to films, the site, and any copy an AI writes.

- **No music, ever.** Audio is sound effects only. Whooshes, ticks, clicks, chimes, thuds, UI hits. Mix to about **−22 LUFS** (the mixer uses ffmpeg `loudnorm` with `I=-22`).
- **No images of women.** No photos of people. Avatars are abstract marks or initials.
- **2D only.** No 3D, no tilted planes, no perspective, no iris wipes. Camera moves are push, pan, zoom, and whip, in the plane.
- **Honest claims.** Do not invent customers, awards, or results. Numbers on screen come from the brief or are clearly sample data. The engine rejects copy that is not in the brief (plus a small allow-list of glue words).
- **Halal clients only.** The keyword screen in `packages/engine/src/halal.js` refuses gambling, betting, prediction markets, adult content, alcohol, and drugs. It is a keyword check, not a lawyer. Ordinary words (“slots” on a calendar, a public “forum”) are left alone. Orders also require a pledge: no music, nothing impermissible.
- **Real logos only.** Official SVGs or a logo scraped from the client’s own site. No made-up letter tiles standing in for a brand. If a logo cannot be fetched, the film proceeds without a fake one.
- **Never put secrets in the repo.** No API keys, payment credentials, HMAC keys, or client contracts. `.env.example` has empty values on purpose. Orders on disk (`apps/web/data/`) stay gitignored.

### Colour and type (the site)

Light theme only. Do not invent a dark marketing site.

| Role | Hex |
|------|-----|
| Background | `#F6F7F9` |
| Ink | `#0D1222` |
| Muted | `#5B6275` |
| Cobalt (primary) | `#2E4BDB` |
| Deep | `#1F33B0`, `#16258A`, `#0B1340` |
| Light | `#4F6CEB`, `#7F96F4`, `#B8C6FB`, `#DCE4FF` |

- Wordmark: lowercase **harkat**, ink. Mark: 5-blade swirl, cobalt `#2E4BDB`. Files: `apps/web/public/assets/harkat-mark.svg`, `harkat-mark-ink.svg`, `harkat-mark-white.svg`.
- Type: **Geist** 500–600 for headings, tight tracking (about −0.055em). **Geist Mono** for small labels. Loaded with `next/font` in `apps/web/app/layout.tsx`. A film uses one font (Geist variable, served from `apps/web/public/fonts/Geist-Variable.woff2`).
- Primary button: black, with a blue gradient “tail” holding an arrow.
- Motion personality for films: fast, detailed, no fades-to-black. Masked letter reveals, match cuts. One hue per film after the open.

Full notes: `docs/01_BRAND_KIT.md`, `docs/03_MOTION_CRAFT_AND_STYLES.md`, `docs/05_QUALITY_CHECKLIST.md`, `docs/motion-craft.md`.

### An older chat UI (MotionGPT)

An earlier ChatGPT-style app called **MotionGPT** is **not in this repo**. It was dropped because it wrote animation from scratch and the films were weak. Momin disliked its colours. The UI he designed is still in the public repo `ana-momin/Startup`, folder `Startup 001/apps/studio/` (`src/pages/Chat.tsx`, `src/components/PromptBar.tsx`, `src/components/Sidebar.tsx`, and their CSS). Use that **layout and interaction** as a reference only. Harkat colours and type stay as in the table above. Do not bring MotionGPT’s palette, auth, or Remotion renderer back.

---

## Architecture and folder map

npm workspaces: `apps/web`, `packages/engine`. `packages/sfx` and `films` are separate packages (their own `package.json`, not workspace members) because they pull in Playwright and ffmpeg.

```
apps/web                 Next.js 16.4.6 site (React 19). This is the Vercel root.
  app/                   routes (see below)
  components/            Nav, Footer, order flow, film player, studio preview
  lib/                   orders, payments, altcha, legal, site copy, rate limit
  public/films           Pond mp4s, posters, short silent loops
  public/assets          hero film, marks, Pond logo
  public/fonts           Geist variable, used inside generated film HTML
  vercel.json            install from the monorepo root
  proxy.ts               hides /admin unless ADMIN_KEY matches
packages/engine          brief → film HTML. No network inside compose().
  src/brief.js           validate a brief, halal screen, logo sniff
  src/plan.js            free rule planner + plan validator
  src/llm.js             optional planner. Never writes animation.
  src/scenes.js          scene objects + overlap guard
  src/layout.js          1920×1080 boxes, assertClear
  src/shell.js           wraps shots into one HTML page
  src/film.js            plan → html, duration, SFX cue list
  src/motion.js          shared timing constants
  src/site.js            fetch a public page, extract name, colour, logo
  src/halal.js           keyword screen
  src/copy.js            clip words, escape HTML
  src/color.js           accent from HTML or PNG
  src/sample.js          Keel (fake) and Linear (live linear.app)
  src/cli.js             `npm run sample`
  test/                  engine tests
packages/sfx
  src/synth.js           short generated effects (tick, click, whoosh, chime, thud, ui)
  src/mix.js             lay cues on a silent mp4, loudnorm to −22 LUFS
films
  _template/             film.html scaffold, render.mjs, sfx.mjs, posters.mjs
  harkat-hero/           hand-made hero film + cues.json
  samples/keel|linear    generated sample films
  sfx/                   optional Pond kit. Not in git. Samples use packages/sfx instead.
docs/                    brand, pipeline, craft, offer, quality checklist
test/                    order-storage test + zod/blob pin check
.env.example             every env var, empty, safe to commit
```

There is no database. Orders are JSON files. History for a future prompt UI, if added, belongs in the browser (`localStorage`), not on a server.

### Routes (site)

| Path | What it is |
|------|------------|
| `/` | Marketing home: hero, hero film, Pond logo, work reel, stats, order panel (`#order`) |
| `/work` | Portfolio. Pond films only if the env flag is on. |
| `/process` | How a film is made, FAQ |
| `/studio` | Brief form. Posts to `/api/studio/film`. Preview is HTML in the page, with generated SFX in the browser. |
| `/docs` | Docs index |
| `/docs/how-we-make-films` | Pipeline, in public language |
| `/docs/halal` | What Harkat will not make |
| `/docs/pond-ai` | Pond case study (`/results` redirects here) |
| `/docs/credits` | Style credits |
| `/docs/terms`, `/docs/privacy` | Legal |
| `/paid` | NOWPayments return page. The IPN, not this page, marks the order paid. |
| `/admin` | Order list. 404 unless `ADMIN_KEY` is set and the cookie matches. Open `/admin?key=...` once. |
| `/order` | Redirects to `/#order` |

API:

| Method | Path | Role |
|--------|------|------|
| POST | `/api/studio/film` | Brief in, film HTML out. Same-origin, 30 previews / 10 min / IP. |
| POST | `/api/order` | Save an order. Altcha, honeypot, halal screen, rate limit. |
| GET | `/api/altcha` | Challenge for the “I’m not a robot” widget. |
| POST | `/api/pay/invoice` | Open a NOWPayments invoice. |
| POST | `/api/pay/ipn` | NOWPayments webhook. HMAC with `NOWPAYMENTS_IPN_SECRET`. |
| GET | `/api/pay/status` | Poll invoice status. |
| POST | `/api/admin/pay` | Admin sends a pay link. |
| POST | `/api/admin/logout` | Clear the admin cookie. |
| GET | `/api/favicon` | Favicon helper. |

`apps/web/next.config.ts` sets a strict Content-Security-Policy. `frame-src` allows `https://nowpayments.io` only. `frame-ancestors` is `none` (the site cannot be iframed). Studio film HTML is injected as `srcDoc` on an iframe, which CSP treats as the page’s own document, not a remote frame.

---

## How the engine builds a film

```
brief
  → readBrief (clean, require name / problem / one feature / real hostname, halal, logo sniff)
  → planner
       free: rulePlan() in plan.js
       or optional LLM: planWithModel() in llm.js, then validatePlan()
       if the model plan fails layout, composeWithModel falls back to rules
  → buildShots() in scenes.js
  → assertClear() overlap guard in layout.js
  → page() in shell.js → one HTML file whose JS draws frame t
  → cues: whoosh / tick / ui / click / thud / chime, peak-aligned
```

`compose(input)` does this with **no network**. `composeWithModel(input)` may call the planner and is what `/api/studio/film` uses.

### Brief

Required: product name (≥2 chars), problem or one-liner (≥8 chars), at least one feature, a real `http(s)` hostname. Optional: audience, proof stat, accent `#RRGGBB` (default `#2E4BDB`), logo data-URL (png/jpeg/webp/svg/gif, under ~80KB, no script/iframe/foreignObject), goal `launch | feature | explainer`, tone `quiet | plain | bold`, length `15 | 30 | 45`. Older template names map onto goals: `workflow` → feature, `holo` → explainer, `launch` → launch. `sample: true` marks the film as a sample (Studio always sends this).

### Planner

`rulePlan` clips words out of the brief. It does not invent a sentence.

- Not a feature film: a **problem** beat (vignette `limit`).
- **Intro**: the product name.
- **Benefits**: 2, 3, or 4 features depending on length 15 / 30 / 45. Vignette from the words: search, toggle, chat, chart, code, cards.
- **Proof**: only if the brief has a proof stat, or the goal is not `feature` and the length is over 15s. Vignette `chart`.
- **CTA**: the hostname. Always last.

Scene types: `problem | intro | benefit | proof | cta`. Vignettes: `limit | code | search | toggle | chart | chat | cards`.

The LLM is optional and **off when every key is blank**. It may return only that JSON scene list. The prompt forbids HTML, CSS, JS, and animation, and forbids words that are not in the brief or the scraped site text. `validatePlan` rejects anything else. Temperature 0, max 400 tokens. Default model `gpt-4o-mini` (or `llama-3.3-70b-versatile` on Groq). Cost is logged as `harkat planner source=... in=... out=... usd=...`. Defaults match gpt-4o-mini list price ($0.15 / $0.60 per million tokens), which lands near **$0.0002 per film**. Override with `HARKAT_LLM_PRICE_IN` / `HARKAT_LLM_PRICE_OUT` (dollars per million tokens). A failed or slow call (Studio timeout 4s) falls back to rules and costs $0.

### Scenes and the overlap guard

Frame is **1920×1080**. Each shot is a list of boxes. `assertClear` throws, and the film is not returned, if:

- a box marked `inside` another sits outside that parent, or
- two boxes overlap by less than a 12px gap (nested boxes and boxes in the same `stack` are allowed).

`scenes.js` also refuses a card that is only a glue word (“the”, “a”, …) and a beat with more than six words. `contentRatio` is used by tests so a card is not an empty frame.

Shots become HTML + CSS + a `render(t)` runtime. The same `t` always draws the same frame. Text is escaped. A product name cannot inject markup.

### Render and sound

Two paths:

1. **Studio / Vercel.** Returns HTML + cue list. The browser plays the HTML (iframe `srcDoc`) and synthesises short tones in the Web Audio API. **No mp4 is rendered on Vercel.** Playwright and ffmpeg are not part of the site deploy.
2. **Local mp4.** `films/_template/render.mjs` screenshots the HTML with Playwright (Chromium) and encodes with ffmpeg: 1080p, 30fps, crf 20. `packages/sfx` synthesises a tiny kit and `mix.js` places each cue so its peak hits the cut, then loudnorm to **−22 LUFS**. The old Pond effect kit (`sfxlib`, `sfxlib2`) is not in this repo. Do not invent music to fill that gap.

Hand-made films (the hero) live as `films/<name>/film.html` with their own `render(t)`. They do not go through the planner.

---

## How to run, test, and render

Needs Node and npm. Chromium via Playwright only if you render mp4s.

```bash
npm install
cp .env.example apps/web/.env.local   # optional; blanks are fine
npm run dev                           # http://localhost:3000
```

Studio: http://localhost:3000/studio.

From the repo root:

| Command | What it does |
|---------|----------------|
| `npm run dev` | Next dev server (`apps/web`) |
| `npm run build` | `next build` in `apps/web` |
| `npm run lint` | eslint in `apps/web` |
| `npm run typecheck` | `tsc --noEmit` in `apps/web` |
| `npm test` | `node --test packages/engine/test/*.js test/*.js` |
| `npm run sample` | Build Keel + Linear HTML, render mp4, mix SFX |
| `npm run sample -- --html-only` | HTML + cues only, no video |
| `npm run sample -- keel` | One sample. `linear` fetches https://linear.app |
| `HARKAT_SKIP_LIVE=1 npm run sample` | Skip the live scrape |

Sample render, first time:

```bash
cd films && npm install && npx playwright install chromium
cd .. && npm install --prefix packages/sfx
npm run sample
```

Outputs: `films/samples/<name>/film.html` and `films/samples/<name>/out/<name>-sample.mp4`.

Hand-made hero:

```bash
cd films && npm run render -- harkat-hero
# after effect files exist in films/sfx:
npm run sfx -- harkat-hero
```

New hand-made film: `cd films && npm run new -- acme-launch`, edit `acme-launch/film.html`, set `window.DUR`.

Tests worth knowing:

- `packages/engine/test/plan.test.js` — planner stays inside the brief. “You get Brand-matched” style copy is rejected.
- `packages/engine/test/layout.test.js` — overlap guard.
- `packages/engine/test/film.test.js` — a name with markup cannot break out of the text.
- `packages/engine/test/frames.test.js` — frame checker (type size, card fill) on rendered samples when those frames exist.
- `packages/engine/test/site.test.js` — logo/colour scrape, blocked IPs.
- `test/orders-and-zod.test.js` — zod override, Blob client still loads, a local order file round-trips.

`npm audit` at the root should stay clean. `zod` is pinned to 4.6.7, `@vercel/cli-config` to 0.4.0, `@vercel/oidc` to 4.0.9, via `overrides` in the root `package.json` and in `apps/web/package.json`. **Do not run `npm audit fix --force`.** It would downgrade `@vercel/blob`.

---

## Environment variables

Copy `.env.example` to `apps/web/.env.local`. On Vercel, set the same names on the project. Empty means “feature off”. Nothing in `.env.example` is a real secret.

| Variable | What it does |
|----------|----------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, and pay return URLs. Local default `http://localhost:3000`. |
| `NEXT_PUBLIC_SHOW_POND_WORK` | `true` shows the four Pond films in the reel and on `/work`. Anything else hides them. The live site has this on. |
| `ALTCHA_HMAC_KEY` | Secret for the Altcha proof-of-work check and for the pay token (`lib/payToken.ts`). Required for orders to pass the robot check. |
| `ADMIN_KEY` | Password for `/admin`. If unset, `/admin` is a 404. |
| `NOWPAYMENTS_API_KEY` | NOWPayments API key. Crypto checkout stays off until this **and** the IPN secret are set. Card checkout is not automated. |
| `NOWPAYMENTS_IPN_SECRET` | Verifies the IPN webhook (HMAC-SHA512). |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (private) for order JSON. On Vercel, orders return 503 without it. Locally, orders go to `apps/web/data/orders/*.json` (gitignored). |
| `GROQ_API_KEY` | Optional planner. Used when set and `OPENAI_API_KEY` is not. Base `https://api.groq.com/openai/v1`, model `llama-3.3-70b-versatile`. |
| `OPENAI_API_KEY` | Optional planner. OpenAI-compatible chat completions. |
| `HARKAT_LLM_API_KEY` | Optional planner. Wins over Groq and OpenAI when set. |
| `HARKAT_LLM_BASE_URL` | OpenAI-compatible base. Default `https://api.openai.com/v1`. |
| `HARKAT_LLM_MODEL` | Model name. Default `gpt-4o-mini`, or the Groq llama model when that key is the one in use. |
| `HARKAT_LLM_PRICE_IN` | Dollars **per million** input tokens, for the cost log. Default `0.15`. |
| `HARKAT_LLM_PRICE_OUT` | Dollars per million output tokens. Default `0.60`. |
| `HARKAT_SKIP_LIVE` | `1` skips the linear.app fetch inside `npm run sample`. Not a site variable. |
| `VERCEL` | Set by Vercel. The order route uses it to refuse saves when Blob is missing. |

The planner never sees these keys in the film. Do not log the key values.

---

## Vercel

- Framework: Next.js. **Root Directory must be `apps/web`.** An older setting pointed at `harkat/web`. A deploy with the wrong root fails; it should leave the current production deployment up. Nothing in this repo deploys itself.
- `apps/web/vercel.json`:

  ```json
  { "installCommand": "npm ci --prefix ../..", "buildCommand": "npm run build" }
  ```

  Install runs at the monorepo root so `apps/web` and `packages/engine` both install. Build is `next build` from `apps/web` (`apps/web/package.json`). `outputFileTracingRoot` is the monorepo root when `packages/engine` is visible, so the engine is traced into the function bundle.
- Next.js **16.4.6**. Read `apps/web/node_modules/next/dist/docs/` before inventing APIs. This app uses `proxy.ts` (not `middleware.ts`) for the admin gate, and `cacheComponents` / `partialPrefetching` in `next.config.ts`.
- **Studio preview on Vercel is in-browser HTML, not an mp4.** `/api/studio/film` returns `{ html, duration, events, ... }`. The page plays that HTML. Do not add Playwright or ffmpeg to the Vercel function.
- **Orders need `BLOB_READ_WRITE_TOKEN` and `ALTCHA_HMAC_KEY`.** Without Blob, production order POSTs return 503 and tell the visitor to email `reach.harkat@gmail.com`. Without the HMAC key, the robot check cannot pass.
- **Payments** are crypto via NOWPayments (`NOWPAYMENTS_API_KEY` + `NOWPAYMENTS_IPN_SECRET`). USDT and others. The pay box opens `invoiceUrl`. IPN marks the order paid. `/paid` is only the browser return. Bank transfer and JazzCash / EasyPaisa are mentioned in the terms as coming later. There is no Stripe.
- CSP and the other security headers are in `next.config.ts`. Do not loosen `frame-ancestors` or `script-src` to “make a preview work”.
- `NEXT_PUBLIC_SHOW_POND_WORK=true` on the live project.

---

## Prices (do not change)

Source of truth for the site: `apps/web/lib/order.ts` → `PLANS`.

| Plan | Price | Length | Delivery | Notes |
|------|-------|--------|----------|-------|
| Spark | **$30** | 10–20s | 3 days | 1 revision round |
| Launch | **$50** | 20–40s | 4 days | Most popular. 2 revision rounds |
| Studio | **$100** | 30–60s | 5 days, priority | 4 revision rounds |

Pay when you order. The order flow is a modal on every page (`OrderModal`), opened from “Order a film” and from the plan picker in `#order`.

`docs/04_OFFER_AND_BUSINESS.md` still lists founding prices of $250 / $600 / $1,200. That document is a business note, not the checkout. Leave both alone until Momin changes the offer.

---

## What is done

- One public repo. Site, engine, generated SFX, hand-made hero, four Pond films in `apps/web/public/films`.
- Marketing pages: home, work, process, docs (including halal, terms, privacy, Pond story), paid-return page.
- Order flow with plan picker, brief, Altcha, terms + halal pledge, NOWPayments, admin list.
- Studio: form → `/api/studio/film` → HTML preview + Web Audio ticks. Rate limit, same-origin, size cap, halal, escaped text.
- Engine: rule planner, optional LLM planner with a hard schema, overlap guard, two samples (Keel, Linear), tests.
- SFX mixer at about −22 LUFS. No music path exists.
- Deploy config for a monorepo Vercel project rooted at `apps/web`.
- Security pins for zod, `@vercel/cli-config`, `@vercel/oidc`.
- Quality notes from nine-plus iteration passes against the Pond films: `ITERATIONS.md`. Honest score of the generated samples sat around 8, not 9. A paid film is still finished by a person.

## Known gaps

- Generated films are still templates: a title on a brand field, a dashboard, a card, a ring, a chart. They are not agency-quality launch films. Do not sell the raw Studio output as the delivered film.
- The site was given a responsive CSS pass (`@media (max-width: 720px)` in `globals.css` and several modules) but a phone test on 26 Nov 2026 still felt unresponsive on every page and every scroll. Treat that as unfixed until a real phone-width audit says otherwise (horizontal overflow, `100vh`, tap targets, scroll jank).
- Studio is a separate form page, not the front door. The engine is not yet the main product.
- Domain is not chosen. Brand-kit notes mention Cloudflare Pages; the site is actually set up for **Vercel**.
- No bank/card checkout. Crypto only, and only when NOWPayments keys are present.
- Pond SFX kit is not in the repo. Samples use `packages/sfx` synthesis.
- `npm audit fix --force` is unsafe here (Blob downgrade).
- Halal check is keywords, not a review.
- Admin is a shared password (`ADMIN_KEY`), not user accounts.
- No customer accounts, no server-side film history.

## Roadmap

Do these in order. Do not skip ahead to marketing while the films and the phone experience are still weak.

1. **Finish the product and the testing.** The site has to feel native on a phone. The engine should be the thing people try first. Tests and `next build` stay green.
2. **Production.** Bank (or another real payout path), a domain, then go live. Vercel root must be `apps/web` before that deploy. Blob, Altcha, and NOWPayments keys have to be set or orders and payments do nothing.
3. **Marketing.** LinkedIn and X already exist as brands. Do this after the product is something Momin will send to a stranger.
4. **Next big build: a major engine quality upgrade** toward the style of the best motion-graphics launch videos on X (the Pond / “Pratham” references in `docs/03_MOTION_CRAFT_AND_STYLES.md` and `ITERATIONS.md`). That means the pictures and the motion, not a new page around the same templates. Keep every hard rule above. A paid film is still finished by a person until that upgrade is honestly close.

---

## Working agreement

- Change only what was asked. Do not restyle pages that are not part of the task.
- Do not add music, stock photos of people, 3D, fake logos, or fake metrics.
- Do not commit `.env`, `.env.local`, `apps/web/data/`, or rendered `out/` mp4s that are not already tracked.
- Prices stay $30 / $50 / $100.
- Push to `main`.
