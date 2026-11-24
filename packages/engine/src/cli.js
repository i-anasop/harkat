import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compose, SAMPLES } from "./index.js";
import { synthKit } from "../../sfx/src/synth.js";
import { mix } from "../../sfx/src/mix.js";

const root = path.resolve(import.meta.dirname, "../../..");
const names = process.argv.slice(2).filter((a) => !a.startsWith("--") && a !== "sample");
const list = names.length ? SAMPLES.filter((s) => names.includes(s.id)) : SAMPLES;
if (!list.length) {
  console.error("No matching sample. Use northstar, lumen, or relay.");
  process.exit(1);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "inherit" });
    child.on("close", (code) => (code ? reject(new Error(`${cmd} exited ${code}`)) : resolve()));
  });
}

for (const brief of list) {
  const dir = path.join(root, "films/samples", brief.id);
  const silent = path.join(dir, `out/${brief.id}-silent.mp4`);
  const final = path.join(dir, `out/${brief.id}-sample.mp4`);
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
  await run("node", [path.join(root, "films/_template/render.mjs"), dir, "--out", `${brief.id}-silent.mp4`]);
  const sfxDir = path.join(dir, "sfx");
  synthKit(sfxDir);
  const mixed = await mix({ video: silent, cues: made.events, sfxDir, out: final, target: -22 });
  console.log(`  mix → ${mixed.output?.toFixed?.(1) ?? mixed.measured} LUFS, target ${mixed.target}`);
  console.log(`  ${final}`);
}
