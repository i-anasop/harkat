# 02 · Pipeline & Workflow

## Stack
HTML/JS film → `render(t)` per frame → **Playwright** capture → **ffmpeg** encode → SFX mix.

## Steps
1. **Reference study.** Break the reference down frame by frame: transitions, camera, text animation, alignment, pacing. Write the notes down before building.
2. **Build the film.**
   - Deterministic: the same `t` always gives the same frame.
   - 2D camera moves only, on transitions and kinetic text.
   - Real, rich UI in every card. Real brand logos from `simple-icons`.
3. **Render.**
   - 30fps default. Use **60fps** where it adds visible smoothness.
   - ffmpeg `crf ~20` (about 10 MB for 40 s).
4. **SFX.**
   - Kit: `sfxlib`, `sfxlib2`, `pond_sfx2.py` mixer (from "Pond Better SFX Kit.zip").
   - Whooshes peak on cuts. UI hits, ticks, chimes, thuds sit on visual events.
   - Mix to about **−22 dBFS**. **Never add music.**
5. **Iterate.** Point-by-point feedback. Change only what was asked. Version files clearly (v1, v2, …).
6. **Ship.** Run `05_QUALITY_CHECKLIST.md`, then deliver.

## Film spec
- Length 30–40 s
- Hook in the first 3 s
- CTA with the URL at the end
- Light theme, one font, one hue

## Repo hygiene (important since the repo is shared)
- No API keys, tokens or payment credentials in the repo. Use env vars.
- Keep client contracts and private files out of public folders.
- Don't commit huge font downloads or raw renders. Keep outputs in a separate folder.
