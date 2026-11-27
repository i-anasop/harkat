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
import { accentFromHtml, accentFromPng, extractSite, fetchImageData, fetchPublicPage } from "./site.js";

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
for (const id of ["keel", "linear", "north", "lumen", "harbor"]) {
  const read = readBrief(DIRECTOR_BRIEFS[id]);
  if (!read.ok) throw new Error(read.reason);
  let brief = read.brief;
  if (id === "linear" && process.env.HARKAT_SKIP_LIVE !== "1") {
    try {
      const page = await fetchPublicPage(brief.url, { timeout: 12000, maxBytes: 2_000_000 });
      const site = extractSite(page.html, page.url);
      let logo = site.logoSvg ? `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}` : null;
      if (!logo && site.logoHref) logo = await fetchImageData(site.logoHref);
      const fromLogo = !site.color && logo?.startsWith("data:image/png") ? accentFromPng(logo) : null;
      const accent = site.color || fromLogo || accentFromHtml(page.html) || brief.accent;
      brief = { ...brief, name: site.name || brief.name, accent, logo: logo || null };
      console.log("linear live", brief.accent, logo ? "logo" : "no-logo");
    } catch (err) {
      console.log("linear live skipped", err.message);
    }
  }
  const made = compileDirection(brief, RECORDED[id], { fontUrl: "../Geist.woff2", seed: id });
  if (!made.ok) throw new Error(`${id}: ${made.reason}`);
  films.push({ id, html: made.html, duration: made.duration, events: made.events });
}
{
  const again = readBrief(DIRECTOR_BRIEFS.keel);
  const alt = compileDirection(again.brief, RECORDED.keel, { fontUrl: "../Geist.woff2", seed: "beta" });
  if (!alt.ok) throw new Error(alt.reason);
  films.push({ id: "keel-seed-b", html: alt.html, duration: alt.duration, events: alt.events });
}

for (const film of films) {
  const dir = path.join(out, film.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "film.html"), film.html);
  writeFileSync(path.join(dir, "cues.json"), JSON.stringify({ duration: film.duration, events: film.events }, null, 2));
}

const browser = await chromium.launch();
const times = [1.4, 4.2, 8.8, 10.4, 16.2, 18.2, 22.4, 26.2, 28.6];
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

function encodeFilm(browser, film, viewport) {
  const fps = 30;
  const frames = Math.round(film.duration * fps);
  const sheetDir = path.join(out, `${film.id}-frames`);
  mkdirSync(sheetDir, { recursive: true });
  const target = path.join(out, `${film.id}.mp4`);
  return (async () => {
    const ff = spawn("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "veryfast", "-movflags", "+faststart",
      target,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const page = await browser.newPage({ viewport });
    await page.goto(pathToFileURL(path.join(out, film.id, "film.html")).href);
    await page.waitForFunction("window.READY === true");
    let sheet = 0;
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.render(t), i / fps);
      const buf = await page.screenshot({ type: "jpeg", quality: 72 });
      if (i % 15 === 0) {
        writeFileSync(path.join(sheetDir, `f-${String(sheet).padStart(3, "0")}.jpg`), buf);
        sheet += 1;
      }
      if (!ff.stdin.write(buf)) await new Promise((resolve) => ff.stdin.once("drain", resolve));
      if (i % fps === 0) process.stdout.write(`\r${film.id} ${(i / fps).toFixed(0)}s`);
    }
    await page.close();
    ff.stdin.end();
    await new Promise((resolve, reject) => ff.on("close", (code) => (code ? reject(new Error(`ffmpeg ${film.id} ${code}`)) : resolve())));
    const cols = 10;
    const rows = Math.ceil(sheet / cols);
    const sheetPath = path.join(out, `${film.id}-sheet.jpg`);
    await new Promise((resolve, reject) => {
      const tile = spawn("ffmpeg", [
        "-y", "-loglevel", "error",
        "-framerate", "30", "-i", path.join(sheetDir, "f-%03d.jpg"),
        "-vf", `scale=${viewport.width > viewport.height ? 320 : 180}:${viewport.width > viewport.height ? 180 : 320},tile=${cols}x${rows}`,
        "-frames:v", "1", sheetPath,
      ]);
      tile.on("close", (code) => (code ? reject(new Error(`tile ${film.id} ${code}`)) : resolve()));
    });
    console.log(`\nmp4 ${target}`);
  })();
}

const browser2 = await chromium.launch();
for (const film of films) {
  await encodeFilm(browser2, film, { width: 1920, height: 1080 });
}
const readPortrait = readBrief(DIRECTOR_BRIEFS.keel);
const portrait = compileDirection(readPortrait.brief, RECORDED.keel, { fontUrl: "../Geist.woff2", seed: "keel", frame: "portrait" });
if (!portrait.ok) throw new Error(portrait.reason);
const portraitFilm = { id: "keel-portrait", html: portrait.html, duration: portrait.duration, events: portrait.events };
mkdirSync(path.join(out, "keel-portrait"), { recursive: true });
writeFileSync(path.join(out, "keel-portrait", "film.html"), portrait.html);
await encodeFilm(browser2, portraitFilm, { width: 1080, height: 1920 });
await browser2.close();
