# Harkat — handoff

This file is the whole context. A future developer or AI should be able to continue Harkat from this document and the repo, with nothing else.

Last updated: 26 Nov 2026, after the AI director (free-model shot plans, richer stage, quota). Update this file whenever routes, prices, env vars, or the engine contract change.

Owner: Momin (Anas). GitHub: `i-anasop/harkat` is the live repo. He works on **`main` only**. Commit and push straight to `main`. Do not open feature branches or pull requests for this repo.

Contact on the site: `reach.harkat@gmail.com`. X: https://x.com/harkatai. LinkedIn: https://www.linkedin.com/company/harkatai.

---

## What Harkat is

Harkat AI makes cheap, agency-quality **2D motion-graphics launch films** for AI and SaaS startups. The films are built with code (HTML that draws a frame at time `t`), not with a video model and not by an LLM writing animation.

Two products share one site today:

1. **The engine, on the home page.** A person describes a product (and can paste a website). The page posts to `/api/studio/film` and plays a sample film in the browser. With a free model key, a director model chooses the concept, the lines, and the shots. The engine compiles that into 2D motion (it does not run model-written HTML). With no key, or when the quota is spent, the old rule planner still runs. A person still finishes any film a client pays for. Past prompts stay in `localStorage` under `harkat.promptHistory` (no database).
2. **The studio service, on `/pro`.** A client orders a film a person makes. Live prices are **Spark $30**, **Launch $50**, **Studio $100**. Older founding notes in `docs/04_OFFER_AND_BUSINESS.md` list $250 / $600 / $1,200. Those were **not** put on the site. Do not change the live prices unless Momin says so.

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
  src/plan.js            free rule planner + plan validator (last resort)
  src/llm.js             legacy one-call planner. Still exported. Not what /api/studio/film uses.
  src/providers.js       free-first chat providers (Gemini, Groq, OpenRouter, Cloudflare, then paid)
  src/direct.js          director pipeline, cache, daily caps, repair
  src/dsl.js             shot schema, honesty check, grammar
  src/stage.js           compiles a direction into 2D HTML (kinetic type, UI, grid, camera)
  src/exemplars.js       four hand-authored directions (the quality bar and the mock model)
  src/reel.js            local stills/mp4s of those films vs the rule planner
  src/scenes.js          old template scenes + overlap guard
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
| `/` | The product. A ChatGPT-style prompt: describe the product, optional website (logo and colours), length 15/30/45. The sample film plays in the thread. History is a sidebar (a drawer on a phone). “Hire a pro” goes to `/pro`. |
| `/pro` | The old marketing home: hero, hero film, Pond logo, work reel, stats, order panel (`#order`). |
| `/work` | Portfolio. Pond films only if the env flag is on. |
| `/process` | How a film is made, FAQ |
| `/studio` | Redirects to `/`. The old form is gone. |
| `/docs` | Docs index |
| `/docs/how-we-make-films` | Pipeline, in public language |
| `/docs/halal` | What Harkat will not make |
| `/docs/pond-ai` | Pond case study (`/results` redirects here) |
| `/docs/credits` | Style credits |
| `/docs/terms`, `/docs/privacy` | Legal |
| `/paid` | NOWPayments return page. The IPN, not this page, marks the order paid. |
| `/admin` | Order list. 404 unless `ADMIN_KEY` is set and the cookie matches. Open `/admin?key=...` once. |
| `/order` | Redirects to `/pro#order` |

API:

| Method | Path | Role |
|--------|------|------|
| POST | `/api/studio/film` | Brief or a free-text `prompt` in, film HTML out. Same-origin, 30 previews / 10 min / IP, plus a director cap (default 8/day/IP and 40/day global, per server instance). Optional `seed` varies the film. A prompt with no website uses `name.example` as a stand-in end card and does not fetch that host. |
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
brief + scraped brand (name, tagline, excerpt, colour, real logo, font name)
  → readBrief (clean, require name / problem / one feature / real hostname, halal, logo sniff)
  → director, only when a provider key is set and the quota allows
       1. concept: treatment, rhythm, layout sequence
       2. beats: lines, words restricted to the brief and the scraped text
       3. shots: layout, motion, camera, enter, ground, sfx
       one repair if a step is not valid JSON
       under a 14s budget this collapses to one call that returns all three
       cache by hash of brief + seed (6 hours). A UTC day is the default seed.
  → normalizeDirection(): drop invented words, fill missing motion, force the end card
  → stage.js places the boxes, assertClear() refuses an overlap
  → one HTML file whose JS draws frame t
  → cues: whoosh / tick / ui / click / thud / chime, peak-aligned
  → any failure, empty key, or a full quota falls back to rulePlan() + scenes.js
```

`compose(input)` is still the rule path and does **no network**. `composeWithModel(input)` is what `/api/studio/film` uses.

### Brief

Required: product name (≥2 chars), problem or one-liner (≥8 chars), at least one feature, a real `http(s)` hostname. Optional: audience, proof stat, accent `#RRGGBB` (default `#2E4BDB`), logo data-URL (png/jpeg/webp/svg/gif, under ~80KB, no script/iframe/foreignObject), goal `launch | feature | explainer`, tone `quiet | plain | bold`, length `15 | 30 | 45`. Older template names map onto goals: `workflow` → feature, `holo` → explainer, `launch` → launch. `sample: true` marks the film as a sample (Studio always sends this).

### Rule planner (last resort)

`rulePlan` clips words out of the brief. It does not invent a sentence. It still feeds `scenes.js`, which is the old template look.

- Not a feature film: a **problem** beat (vignette `limit`).
- **Intro**: the product name.
- **Benefits**: 2, 3, or 4 features depending on length 15 / 30 / 45. Vignette from the words: search, toggle, chat, chart, code, cards.
- **Proof**: only if the brief has a proof stat, or the goal is not `feature` and the length is over 15s. Vignette `chart`.
- **CTA**: the hostname. Always last.

Scene types: `problem | intro | benefit | proof | cta`. Vignettes: `limit | code | search | toggle | chart | chat | cards`.

### Director

The model does not write HTML, CSS, or JavaScript. It returns JSON. `stage.js` draws it. Visible words have to already be in the brief or the scraped page (plus a short glue list: introducing, open, sample, and articles). A number that is not in the brief is rejected. Halal still runs on the brief, and on the concept line even though that line is never shown.

Layouts: `kinetic`, `stage`, `split`, `grid`, `dashboard`, `meter`, `checklist`, `counter`, `flow`, `lockup`, `search`, `ticker`, `end`.

Motion is 2D only: letter reveals, masks, rises, scale-through, a push or a pan, a whip enter. No perspective, no rotateX/rotateY. A counter is used only when the line ends in a number from the brief (`Up to 98%`). The end card is the hostname on the brand colour. SFX only.

`exemplars.js` holds four hand-authored films (Keel, Linear, North, Lumen). Tests compile them. They are also what `node packages/engine/src/reel.js` renders. A live model is not required for those.

Cost is logged as `harkat director source=... in=... out=... usd=... note=...`. Free providers log `usd=0.000000`. A cache hit logs `source=cache` and does not spend a quota slot. The response field `planNote` is `gemini` (or whichever provider answered), `cache`, `no-key`, `quota`, or `off`. `planSource` stays `model` or `rules`, which is what the page already understands.

Caps, per server instance (same shape as the IP limiter; not a global database):

| Env | Default | Meaning |
|-----|---------|---------|
| `HARKAT_DIRECTOR_IP_DAY` | 8 | Director films per IP per UTC day. Cache hits are free. |
| `HARKAT_DIRECTOR_GLOBAL_DAY` | 40 | Director films per instance per UTC day. |
| `HARKAT_DIRECTOR_TOKEN_BUDGET` | 4500 | Input + output tokens per film, then the call stops. |
| `HARKAT_DIRECTOR_BUDGET_MS` | 9000 on the API | Wall clock. Under 14000ms the director makes one call. 20000ms makes three. |
| `HARKAT_DIRECTOR_STEPS` | auto | Force `1` or `3`. |
| `HARKAT_DIRECTOR` | | `0` forces the rule planner even if a key is set. |
| `HARKAT_DIRECTOR_ALLOW_PAID` | | `1` lets a paid key run after a free key fails. Off, a paid key is used only when it is the only key. |

The route sets `maxDuration = 30`. The default 9s budget is one model call so a 10-second platform limit still returns a film (rules, if the model is slow). Raise `HARKAT_DIRECTOR_BUDGET_MS` to `20000` when the Vercel plan actually allows 30 seconds. That turns on concept → beats → shots.

`planWithModel` in `llm.js` is still exported. Groq’s default model there is now `openai/gpt-oss-120b`, because `llama-3.3-70b-versatile` was shut off for free and developer accounts on 16 Aug 2026. The studio route does not call `planWithModel`.

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

The prompt is http://localhost:3000. The marketing site and the order form are http://localhost:3000/pro. `/studio` redirects home.

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
| `GEMINI_API_KEY` | **The key to create.** Free director. See the section below. |
| `GEMINI_MODEL` | Optional. Default `gemini-3.5-flash-lite`. |
| `GROQ_API_KEY` | Free director fallback. Default model `openai/gpt-oss-120b`. |
| `GROQ_MODEL` | Optional override for the Groq model id. |
| `OPENROUTER_API_KEY` | Free director fallback. Default model `openrouter/free`. |
| `OPENROUTER_MODEL` | Optional. Keep a `:free` id or `openrouter/free` if this must stay $0. |
| `CLOUDFLARE_API_TOKEN` | Workers AI token. Used only together with the account id. |
| `CLOUDFLARE_ACCOUNT_ID` | Account id in the Workers AI base URL. Not a secret of the same kind, but do not commit a real one. |
| `CLOUDFLARE_AI_MODEL` | Optional. Default `@cf/meta/llama-3.1-8b-instruct`. |
| `CEREBRAS_API_KEY` | Not a renewable free tier. Used only when no free key is set, unless paid fallback is on. |
| `CEREBRAS_MODEL` | Optional. Default `qwen-3.8-27b`. |
| `MISTRAL_API_KEY` | Not free API access. Same rule as Cerebras. |
| `MISTRAL_MODEL` | Optional. Default `mistral-small-latest`. |
| `OPENAI_API_KEY` | Paid. Used only when no free key is set, unless `HARKAT_DIRECTOR_ALLOW_PAID=1`. |
| `HARKAT_LLM_API_KEY` | Paid OpenAI-compatible endpoint. Same rule. Wins over `OPENAI_API_KEY` when both are set. |
| `HARKAT_LLM_BASE_URL` | Base for the Harkat/OpenAI provider. Default `https://api.openai.com/v1`. |
| `HARKAT_LLM_MODEL` | Model for that provider. Default `gpt-4o-mini`. |
| `HARKAT_LLM_PRICE_IN` | Dollars **per million** input tokens, for the cost log of the paid provider. Default `0.15`. |
| `HARKAT_LLM_PRICE_OUT` | Dollars per million output tokens. Default `0.60`. |
| `HARKAT_DIRECTOR` | `0` forces the rule planner. |
| `HARKAT_DIRECTOR_STEPS` | `1` or `3`. Empty follows the time budget. |
| `HARKAT_DIRECTOR_BUDGET_MS` | Milliseconds for one preview. API default 9000. Set `20000` for three steps. |
| `HARKAT_DIRECTOR_IP_DAY` | Director films per IP per UTC day. Default 8. |
| `HARKAT_DIRECTOR_GLOBAL_DAY` | Director films per instance per UTC day. Default 40. |
| `HARKAT_DIRECTOR_TOKEN_BUDGET` | Tokens per film. Default 4500. |
| `HARKAT_DIRECTOR_ALLOW_PAID` | `1` allows a paid provider to run after the free ones fail. |
| `HARKAT_SKIP_LIVE` | `1` skips the linear.app fetch inside `npm run sample`. Not a site variable. |
| `VERCEL` | Set by Vercel. The order route uses it to refuse saves when Blob is missing. |

The director never puts these keys in the film or in the log line. Do not log the key values.

### Which free key Momin should create

Checked 26 Nov 2026. Limits move. The links below are the consoles. After creating a key, set it on the Vercel project (Root Directory `apps/web`) and in `apps/web/.env.local`. Do not commit it.

**Create this one first.**

1. **Gemini** — [Google AI Studio API keys](https://aistudio.google.com/apikey). Vercel env: `GEMINI_API_KEY`. The engine calls `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` with model `gemini-3.5-flash-lite`. That model is on the free tier. `gemini-2.5-flash` is deprecated for new projects and, from 1 Dec 2026, routes to Flash-Lite anyway. Google does not publish one RPM number for every project. One free project read in Oct 2026 showed about **15 requests/minute and 500 requests/day** for Flash-Lite, and about 20/day for the larger Flash models. Check the project’s own limit page in AI Studio. A three-step film is three requests. The default API budget is one request.

**Add one of these if Gemini rate-limits.** The engine tries them in this order and skips any key that is blank.

2. **Groq** — [console.groq.com/keys](https://console.groq.com/keys). Vercel env: `GROQ_API_KEY`. Model `openai/gpt-oss-120b`. Free-plan table (Groq’s own limits page, Nov 2026): about **30 requests/minute, 1,000/day, 8,000 tokens/minute, 200,000 tokens/day**. The token-per-minute cap is the tight one, so a long prompt can 429 and the engine moves on. Do not set the old `llama-3.3-70b-versatile` id. Groq shut that model off for free and developer accounts on 16 Aug 2026.

3. **OpenRouter** — [openrouter.ai/keys](https://openrouter.ai/keys). Vercel env: `OPENROUTER_API_KEY`. Model `openrouter/free` (it only routes to free models). Free variants are about **20 requests/minute and 50/day** until the account has bought credits. Leave `OPENROUTER_MODEL` empty so it stays on the free router.

4. **Cloudflare Workers AI** — [REST setup](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/). Vercel env: `CLOUDFLARE_API_TOKEN` **and** `CLOUDFLARE_ACCOUNT_ID`. Both are required. Free allocation: **10,000 Neurons/day**, reset 00:00 UTC, on the Workers Free plan. Default model `@cf/meta/llama-3.1-8b-instruct` (weaker JSON than Gemini; it is a fallback).

**Do not create these expecting them to be free.**

- **Cerebras** — [cloud.cerebras.ai](https://cloud.cerebras.ai). A new account gets **$5 of credits after a payment method is added**. The credits expire after 30 days. There is no renewing free tier. `CEREBRAS_API_KEY` works, but it is not used when a free key is set unless `HARKAT_DIRECTOR_ALLOW_PAID=1`.
- **Mistral** — [console.mistral.ai](https://console.mistral.ai). As of Nov 2026 the free plan includes Vibe and Studio, **not API calls**. API access needs billing. `MISTRAL_API_KEY` is supported under the same paid rule.
- **OpenAI** and `HARKAT_LLM_API_KEY` — paid. Same rule. Leave them unset if the goal is $0.

No key was set in the environment that built this. The pipeline was tested with recorded model replies in `exemplars.js`. A live preview stays on the rule planner until `GEMINI_API_KEY` (or another key above) is set. Spam still gets a film: the cap falls back to rules and costs nothing.

---

## Vercel

- Framework: Next.js. **Root Directory must be `apps/web`.** An older setting pointed at `harkat/web`. A deploy with the wrong root fails; it should leave the current production deployment up. Nothing in this repo deploys itself.
- `apps/web/vercel.json`:

  ```json
  { "installCommand": "npm ci --prefix ../..", "buildCommand": "npm run build" }
  ```

  Install runs at the monorepo root so `apps/web` and `packages/engine` both install. Build is `next build` from `apps/web` (`apps/web/package.json`). `outputFileTracingRoot` is the monorepo root when `packages/engine` is visible, so the engine is traced into the function bundle.
- Next.js **16.4.6**. Read `apps/web/node_modules/next/dist/docs/` before inventing APIs. This app uses `proxy.ts` (not `middleware.ts`) for the admin gate, and `cacheComponents` / `partialPrefetching` in `next.config.ts`.
- **The home preview on Vercel is in-browser HTML, not an mp4.** `/api/studio/film` returns `{ html, duration, events, ... }`. The page plays that HTML. Do not add Playwright or ffmpeg to the Vercel function.
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
- Marketing pages live at `/pro`, plus work, process, docs (including halal, terms, privacy, Pond story), and the paid-return page.
- Order flow with plan picker, brief, Altcha, terms + halal pledge, NOWPayments, admin list. Prices unchanged.
- Home is the prompt. A sentence (optional website, length) → `/api/studio/film` → HTML preview + Web Audio ticks in the thread. History is `localStorage`. Rate limit, same-origin, size cap, halal, escaped text. `briefFromPrompt` in `packages/engine/src/prompt.js` turns the sentence into a brief. No website means a `name.example` stand-in, not a fetched host.
- Engine: rule planner, optional LLM planner with a hard schema, overlap guard, two samples (Keel, Linear), tests.
- SFX mixer at about −22 LUFS. No music path exists.
- Deploy config for a monorepo Vercel project rooted at `apps/web`.
- Security pins for zod, `@vercel/cli-config`, `@vercel/oidc`.
- Quality notes from nine-plus iteration passes against the Pond films: `ITERATIONS.md`. Honest score of the generated samples sat around 8, not 9. A paid film is still finished by a person.

## Known gaps

- **The director is in, and it is not agency-final.** With a key, two briefs no longer share one template sequence: a dev tool can open on a meter, a finance tool on a colour field, a design tool on a grid, with a product window, a checklist, a flow, a ticker, or a counter, then the hostname on the brand colour. Without a key, the old templates still run, on purpose. The pictures are still a layout system, not a frame-by-frame film. The reference sheets (Runinfra, Reason, Synteq, Holo, the people-search film, the Pinterest concept) have custom illustration and tighter timing than this stage can draw. A paid film is still finished by a person. Do not sell the raw preview as the delivered film.
- Phone layout was fixed on 26 Nov 2026. The thing that made every page feel frozen was `overflow-x: clip` on `html`, `body`, and `.page`: CSS then turns the other axis into a scroll container, and iOS swallows the touch. Do not put overflow-x back on those elements. The `/pro` reel no longer uses a sticky `100vh` scrub on screens 860px and under (the films stack). Full-bleed no longer uses `100vw`. Heights that fill the screen use `dvh`. Inputs are 16px so iOS does not zoom. Tap targets are at least 44px. A headless check at 360, 375, 390, and 414 found `scrollWidth === clientWidth` on `/`, `/pro`, `/work`, `/process`, `/docs`, and `/paid`, including after a film was generated.
- Domain is not chosen. Brand-kit notes mention Cloudflare Pages; the site is actually set up for **Vercel**.
- No bank/card checkout. Crypto only, and only when NOWPayments keys are present.
- Pond SFX kit is not in the repo. Samples use `packages/sfx` synthesis.
- `npm audit fix --force` is unsafe here (Blob downgrade).
- Halal check is keywords, not a review.
- Admin is a shared password (`ADMIN_KEY`), not user accounts.
- No customer accounts, no server-side film history.

## Roadmap

Do these in order. Do not skip ahead to marketing while the films and the phone experience are still weak.

1. **Finish the product and the testing.** The phone layout, the prompt home, and the director are in. What is still unfinished is the last mile of the pictures: the stage is a designed system, not a bespoke film. Tests and `next build` stay green. Set `GEMINI_API_KEY` before judging a live preview.
2. **Production.** Bank (or another real payout path), a domain, then go live. Vercel root must be `apps/web` before that deploy. Blob, Altcha, and NOWPayments keys have to be set or orders and payments do nothing.
3. **Marketing.** LinkedIn and X already exist as brands. Do this after the product is something Momin will send to a stranger.
4. **Keep pushing the pictures** toward the reference sheets in the handoff notes (kinetic type, UI mocks, masks, scale-through, brand colour, 2D, SFX only). The director is the system those pictures come out of. The next gain is richer components inside `stage.js`, not another template in `scenes.js`, and not model-written HTML. A paid film is still finished by a person until that is honestly close.

---

## What changed on 26 Nov 2026

Three commits on `main`, in this order:

1. **`HANDOFF.md`.** This file.
2. **Phone layout.** Removed `overflow-x` from `html`, `body`, and `.page` (that was what made scrolling feel dead). Stacked the marketing reel under 860px, swapped `100vh` for `100dvh`, stopped using `100vw`, raised tap targets to 44px, set form text to 16px, and added a real menu under 720px. Decorative loops and the grain filter stay off on small screens so a finger-drag is not fighting them.
3. **The prompt is the home page.** Layout ideas came from the old MotionGPT chat in `ana-momin/Startup` (`Startup 001/apps/studio`): a centred box, a thread under it, a history sidebar. Colours are Harkat’s, not MotionGPT’s. `/pro` is the previous landing, with the same work, prices, and order flow. `/studio` redirects home.
4. **Prompt-home polish (same day).** The tab title is `Harkat — AI launch films for startups`. The sidebar collapses to an icon rail (`harkat.sidebar`). History is grouped (Pinned, Today, Yesterday, Previous 7 days, Older) with rename, pin, and a confirmed delete. Search filters it. A website is a chip inside the box (`/api/brand` for the colour, `/api/favicon` for the mark). Length is a clock button, default 15s. Suggestion chips are gone. Scrollbars on this page are thin and only show on hover. MotionGPT’s light/dark switch is here as `harkat.theme` on the prompt page only; `/pro` stays light. The pictures were not changed.
5. **Typing no longer crashes the page.** `useSyncExternalStore` was given `() => Date.now()`. React calls that on every render, sees a new number, and renders again until it dies — the “This page couldn’t load” screen, including while typing. The day used to group history is now cached (`apps/web/lib/homeState.mjs`). Saved films from older versions, and corrupt JSON, are ignored instead of thrown. `HomeBoundary` catches anything left and can clear the saved list. Do not put `Date.now()` in a store snapshot.

## What changed on 26 Nov 2026 (director)

The rule planner is still the fallback. `/api/studio/film` now asks a director model, when a free key is set, for a concept, then beats, then a shot list. `stage.js` compiles that into the film. Words that are not in the brief are rejected. Overlap still fails the build. One bad JSON reply is repaired once. The same brief is cached; a `seed` (or the next UTC day) changes it. Eight films per IP per day and forty per instance, then the preview falls back to rules. No key, no charge.

Hand-authored stand-ins, so the stage can be judged without a key: Keel (meter, type, window, `98%`), Linear (search, checklist), North (colour field, dashboard, flow), Lumen (grid, ticker). Render them with `node packages/engine/src/reel.js` and `node packages/engine/src/reel.js --mp4`. They are not the old template look. They are also not the reference films. Honest gap: simple windows, no custom illustration, timing is a weighted shot list.

## Working agreement

- Change only what was asked. Do not restyle pages that are not part of the task.
- Do not add music, stock photos of people, 3D, fake logos, or fake metrics.
- Do not commit `.env`, `.env.local`, `apps/web/data/`, or rendered `out/` mp4s that are not already tracked.
- Prices stay $30 / $50 / $100.
- Push to `main`.
