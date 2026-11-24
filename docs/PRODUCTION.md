# Production readiness

## Ready

- One repo. Site in `apps/web`. Film engine in `packages/engine`. Effects in `packages/sfx`.
- Three looks: Launch, Holo, Workflow. A brief picks one, or Studio does. They render with no API key.
- Orders and the live prices are unchanged ($30 / $50 / $100).
- Studio checks the brief, refuses halal-excluded work, escapes text so a name cannot inject markup, and limits how often and how large a preview can be.
- Engine tests cover the screen, a repeated render, and markup in a name.
- Next.js 16.4.6. `npm run build` in `apps/web` passes.

## Not ready

- Do not deploy until Vercel’s root directory is `apps/web`. The old folder was `harkat/web`. A failed build should leave the current site up.
- Domain is still undecided.
- `npm audit` at the repo root is clean. `zod` is pinned to 4.6.7, `@vercel/cli-config` to 0.4.0, and `@vercel/oidc` to 4.0.9, through `overrides` in the root and in `apps/web`. A test writes and reads a local order file, and the Blob client still loads. `npm audit fix --force` would downgrade Blob. Do not run it.
- The films are not ready to sell as finished agency work. Titles now sit on a brand field and the copy is grammatical, but the pictures are still templates: a dashboard, a card, a ring. A paid job should still be finished by a person. Do not deploy.
- The Pond sound kit is not in the repo. The mix uses generated effects.

## How to render

```bash
cd films && npm install && npx playwright install chromium
cd .. && npm install --prefix packages/sfx
npm run sample
```
