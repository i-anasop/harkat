// Render stills and short mp4s for the director films and the rule-based Keel film.
// Usage: node packages/engine/src/reel.js [--mp4]
import { spawn } from "node:child_process";
import { mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { readBrief } from "./brief.js";
import { compileDirection } from "./direct.js";
import { DIRECTOR_BRIEFS, RECORDED } from "./exemplars.js";
import { compose } from "./index.js";

const root = path.resolve(import.meta.dirname, "../../..");
const require = createRequire(path.join(root, "films/package.json"));
const { chromium } = require("playwright");
const out = "/tmp/harkat-reel";
const font = path.join(root, "films/_template/lib/Geist-Variable.woff2");
mkdirSync(out, { recursive: true });
try { symlinkSync(font, path.join(out, "Geist.woff2")); } catch { /* already linked */ }

const films = [];
const old = compose({ ...DIRECTOR_BRIEFS.keel, length: 15 }, { fontUrl: "../Geist.woff2" });
if (!old.ok) throw new Error(old.reason);
films.push({ id: "keel-rules", html: old.html, duration: old.duration, events: old.events });
for (const id of ["keel", "linear", "north", "lumen"]) {
  const read = readBrief(DIRECTOR_BRIEFS[id]);
  if (!read.ok) throw new Error(read.reason);
  const made = compileDirection(read.brief, RECORDED[id], { fontUrl: "../Geist.woff2", seed: id });
  if (!made.ok) throw new Error(`${id}: ${made.reason}`);
  films.push({ id, html: made.html, duration: made.duration, events: made.events });
}

for (const film of films) {
  const dir = path.join(out, film.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "film.html"), film.html);
  writeFileSync(path.join(dir, "cues.json"), JSON.stringify({ duration: film.duration, events: film.events }, null, 2));
}

const browser = await chromium.launch();
const times = [1.8, 4.3, 6.8, 9.3, 11.8, 14.2];
for (const film of films) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(path.join(out, film.id, "film.html")).href);
  await page.waitForFunction("window.READY === true");
  const dir = path.join(out, film.id);
  for (const t of times) {
    await page.evaluate((time) => window.render(time), t);
    await page.screenshot({ path: path.join(dir, `${t.toFixed(1)}.jpg`), type: "jpeg", quality: 82 });
  }
  await page.close();
  console.log("stills", film.id);
}
await browser.close();

if (!process.argv.includes("--mp4")) process.exit(0);

const browser2 = await chromium.launch();
for (const film of films) {
  const fps = 12;
  const frames = Math.round(film.duration * fps);
  const target = path.join(out, `${film.id}.mp4`);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "veryfast", "-movflags", "+faststart",
    target,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const page = await browser2.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(path.join(out, film.id, "film.html")).href);
  await page.waitForFunction("window.READY === true");
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.render(t), i / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 80 });
    if (!ff.stdin.write(buf)) await new Promise((resolve) => ff.stdin.once("drain", resolve));
  }
  await page.close();
  ff.stdin.end();
  await new Promise((resolve, reject) => ff.on("close", (code) => (code ? reject(new Error(`ffmpeg ${film.id} ${code}`)) : resolve())));
  console.log("mp4", target);
}
await browser2.close();
