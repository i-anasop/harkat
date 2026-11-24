// Render a film: deterministic render(t) per frame → Playwright screenshots → ffmpeg (H.264).
// Usage (from films/):  npm run render -- harkat-hero            → harkat-hero/out/<name>.mp4 (silent)
//                       npm run render -- harkat-hero --from 6 --to 9   (preview a range)
// Same pipeline as hero-film/render.py, in Node so it runs without Python.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import ffmpeg from "ffmpeg-static";

const args = process.argv.slice(2);
const dir = path.resolve(args[0] ?? ".");
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const FPS = Number(opt("fps", 30));
const W = Number(opt("w", 1920)), H = Number(opt("h", 1080));
const name = path.basename(dir);
const out = path.join(dir, "out", opt("out", `${name}.mp4`));
mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(path.join(dir, "film.html")).href);
await page.waitForFunction("window.READY === true");
const DUR = Number(opt("dur", await page.evaluate("window.DUR ?? 20")));
const from = Number(opt("from", 0)), to = Math.min(DUR, Number(opt("to", DUR)));

const ff = spawn(ffmpeg, [
  "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });

const frames = Math.round((to - from) * FPS);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.render(t), from + i / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % FPS === 0) process.stdout.write(`\r${name}: ${(from + i / FPS).toFixed(1)}s / ${to}s`);
}
await browser.close();
ff.stdin.end();
await new Promise((r, j) => ff.on("close", (c) => (c ? j(new Error(`ffmpeg exited ${c}`)) : r())));
console.log(`\n→ ${path.relative(process.cwd(), out)}`);
