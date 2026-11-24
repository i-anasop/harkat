# Harkat AI

Agency-quality product films for AI and SaaS startups, made with code and sold for much less than an agency.

The public site is the Harkat site. The studio on that site turns a short brief into a sample film. A person still finishes the film a client pays for.

## What’s in here

```
apps/web          the site (home, work, process, docs, orders, studio)
packages/engine   turns a brief into a film. Rules pick the scenes. A model is optional.
packages/sfx      makes short sound effects and mixes them to about −22 dBFS
films             hand-made films (harkat-hero) and the three sample films
docs              brand, pipeline, craft rules, prices, quality checklist
```

Sound is effects only. There is no music anywhere in the product.

## Run the site

```bash
npm install
cp .env.example apps/web/.env.local   # optional
npm run dev
```

Open http://localhost:3000. Studio is at http://localhost:3000/studio.

## Render the sample films

Three fake products, one template each. Every film says it is a sample.

| Film | Template | What it is based on |
|------|----------|---------------------|
| Northstar | Launch | A product tour: problem, name, a dense sample screen, feature cards |
| Lumen | Holo | The light Pond agents film: a colour pill, a huge word, a glass bar, cards around the name |
| Relay | Workflow | A stair of cards, then a map of steps |

```bash
cd films
npm install
npx playwright install chromium
cd ..
npm install --prefix packages/sfx
npm run sample
```

That writes `films/samples/<name>/film.html` and `films/samples/<name>/out/<name>-sample.mp4`.

`npm run sample -- --html-only` skips the video. `npm run sample -- northstar` renders one of them.

In Studio, Auto picks the look from the brief. You can also choose Launch, Holo, or Workflow. A model is optional (`--llm` is not wired on the site; the rules run for free). The model path in the engine can only shorten words already in the brief. It never writes the animation.

## Render a hand-made film

```bash
cd films
npm run render -- harkat-hero
```

1080p, 30fps, ffmpeg crf 20. Add a `cues.json` and run `npm run sfx -- harkat-hero` once the effect files are in `films/sfx`. The old Pond effect kit was never in this repo, so the sample film uses effects we generate in `packages/sfx`.

## Deploy

The site is a Next.js app. On Vercel, set the **Root Directory** to `apps/web`.

This repo used to build from `harkat/web`. If Vercel still points there, the next deploy will fail until you change it. A failed deploy should leave the current site up. Do not deploy until that setting is updated. Nothing in this project deploys itself.

Set the same env vars as `.env.example` in the Vercel project. `NEXT_PUBLIC_SHOW_POND_WORK=true` is what shows the Pond films.

## Prices

The site still shows the prices that are live today: Spark $30, Launch $50, Studio $100. The handoff notes list higher founding prices ($250 / $600 / $1,200). Those were not changed.

## What we kept, and what we dropped

Kept: the Harkat site, orders and crypto payments, the Pond portfolio films, the hero film source, the render pipeline, the brand.

Dropped: the old chat app (it wrote animation from scratch and the films were weak), MotionGPT colours and files, duplicate design mockups, and the larger duplicate copies of the Pond videos. The copies the site actually plays are still in `apps/web/public/films`.
