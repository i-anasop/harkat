import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { accentFromHtml, accentFromPng, compose, extractSite, fetchImageData, fetchPublicPage, SAMPLES } from "./index.js";

const root = path.resolve(import.meta.dirname, "../../..");
const names = process.argv.slice(2).filter((a) => !a.startsWith("--") && a !== "sample");
const list = names.length ? SAMPLES.filter((s) => names.includes(s.id)) : SAMPLES;
if (!list.length) {
  console.error("No matching sample. Use keel or linear.");
  process.exit(1);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "inherit" });
    child.on("close", (code) => (code ? reject(new Error(`${cmd} exited ${code}`)) : resolve()));
  });
}

async function liveBrief(brief) {
  if (!brief.live || process.env.HARKAT_SKIP_LIVE === "1") return brief;
  try {
    const page = await fetchPublicPage(brief.url, { maxBytes: 1_500_000, timeout: 8000 });
    const site = extractSite(page.html, page.url);
    let logo = null;
    if (site.logoHref) logo = await fetchImageData(site.logoHref);
    if (!logo && site.logoSvg) logo = `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`;
    const fromLogo = !site.color && logo?.startsWith("data:image/png") ? accentFromPng(logo) : null;
    const accent = site.color || fromLogo || accentFromHtml(page.html) || brief.accent;
    console.log(`${brief.id} live ${site.name || brief.name} ${accent} logo ${logo ? "yes" : "no"}`);
    return { ...brief, name: site.name || brief.name, accent, logo: logo || null };
  } catch (err) {
    console.error(`${brief.id} live scrape failed: ${err.message}`);
    return { ...brief, logo: null };
  }
}

for (const raw of list) {
  const brief = await liveBrief(raw);
  const dir = path.join(root, "films/samples", raw.id);
  const silent = path.join(dir, `out/${raw.id}-silent.mp4`);
  const final = path.join(dir, `out/${raw.id}-sample.mp4`);
  mkdirSync(dir, { recursive: true });
  const made = compose(brief, { fontUrl: "../../_template/lib/Geist-Variable.woff2" });
  if (!made.ok) {
    console.error(brief.id, made.reason);
    process.exit(1);
  }
  writeFileSync(path.join(dir, "film.html"), made.html);
  writeFileSync(path.join(dir, "cues.json"), JSON.stringify({ template: made.template, duration: made.duration, events: made.events }, null, 2));
  console.log(`${brief.id} (${made.template}) ${made.duration}s`);
  if (process.argv.includes("--html-only")) continue;
  const { synthKit } = await import("../../sfx/src/synth.js");
  const { mix } = await import("../../sfx/src/mix.js");
  await run("node", [path.join(root, "films/_template/render.mjs"), dir, "--out", `${brief.id}-silent.mp4`]);
  const sfxDir = path.join(dir, "sfx");
  synthKit(sfxDir);
  const mixed = await mix({ video: silent, cues: made.events, sfxDir, out: final, target: -22 });
  console.log(`  mix → ${mixed.output?.toFixed?.(1) ?? mixed.measured} LUFS, target ${mixed.target}`);
  console.log(`  ${final}`);
}
