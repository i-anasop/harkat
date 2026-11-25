# Harkat film pipeline

Hand-made films live here, one folder each, with a deterministic `film.html` (`render(t)` per frame).

Generated films come from `packages/engine` (a brief in, one of these films out). The samples are `samples/keel` and `samples/linear`. See the root README.

```
films/
  _template/       film.html scaffold, lib/motion.js (easing, 2D camera, kinetic text, blob portal),
                   render.mjs (Playwright → ffmpeg), sfx.mjs (SFX mix), posters.mjs (site assets)
  sfx/             unzip "Pond Better SFX Kit.zip" here (sfxlib, sfxlib2) — not committed
  harkat-hero/     the hero film + cues.json
  <client-film>/   one folder per film
```

## Setup (once)
```
cd films
npm install
npx playwright install chromium
```

## Make a film
1. **Reference:** study the reference frame by frame; copy its structure (transitions, camera, text, pacing).
2. **Build:** `npm run new -- acme-launch`, then edit `acme-launch/film.html`. Set `window.DUR` (30–40s; hero/montage ~20s). Hook in first 3s, URL CTA at the end.
3. **Render:** `npm run render -- acme-launch` → `acme-launch/out/acme-launch.mp4` (1080p, 30fps, crf 20). Preview a range: `--from 6 --to 9`.
4. **SFX:** write `acme-launch/cues.json` (see `harkat-hero/cues.json`), then `npm run sfx -- acme-launch`. Whooshes use `"align": "peak"` so they peak on the cut. Mixed to about −22. **Never music.**
5. **Iterate:** change only the points the client lists.

## Rules
No music. No images of women (abstract avatars/initials). No 3D / tilted planes / iris wipes — 2D push, pan, zoom, whip + blob portals only. Real logos (`simple-icons`), client colours. Halal clients only.

## Pond films → website
`npm run posters -- <folder with the 4 MP4s>` writes MP4s, posters and the Results loop to `apps/web/public/films/`.
The live site shows them when `NEXT_PUBLIC_SHOW_POND_WORK=true`.
