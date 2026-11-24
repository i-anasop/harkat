// Mix SFX onto a rendered film. Sound effects only — never music.
// Usage (from films/):  npm run sfx -- harkat-hero
// Reads <film>/cues.json:
//   {
//     "video": "out/harkat-hero.mp4",       // relative to the film folder
//     "out": "out/harkat-hero-sfx.mp4",
//     "target": -22,                        // overall loudness, LUFS (≈ dBFS on this kind of mix)
//     "cues": [ { "t": 1.8, "sfx": "whoosh/whoosh_03", "gain": 0, "align": "peak" } ]
//   }
// "sfx" is a path inside SFX_DIR (default films/sfx) without extension (.wav/.mp3/.ogg/.flac).
// align "peak" shifts the sound so its loudest point lands on t (use for whooshes on cuts);
// align "start" (default) starts it at t (UI hits, ticks, chimes, thuds).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const dir = path.resolve(process.argv[2] ?? ".");
const cfg = JSON.parse(readFileSync(path.join(dir, "cues.json"), "utf8"));
const SFX_DIR = path.resolve(process.env.SFX_DIR ?? path.join(import.meta.dirname, "..", "sfx"));
const video = path.resolve(dir, cfg.video);
const out = path.resolve(dir, cfg.out ?? "out/film-sfx.mp4");
const target = cfg.target ?? -22;
mkdirSync(path.dirname(out), { recursive: true });

function find(name) {
  for (const ext of [".wav", ".mp3", ".ogg", ".flac", ".aif", ".aiff"]) {
    const f = path.join(SFX_DIR, name + ext);
    if (existsSync(f)) return f;
  }
  const avail = readdirSync(path.join(SFX_DIR, path.dirname(name)), { withFileTypes: true }).slice(0, 20).map((d) => d.name).join(", ");
  throw new Error(`SFX not found: ${name} (in ${SFX_DIR}). Nearby: ${avail}`);
}

// Seconds from file start to the loudest sample (mono, 8 kHz is plenty for this).
function peakOffset(file) {
  const r = spawnSync(ffmpeg, ["-v", "error", "-i", file, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
  let max = 0, at = 0;
  for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > max) { max = v; at = i; } }
  return at / 8000;
}

const run = (args) => new Promise((res, rej) => {
  const p = spawn(ffmpeg, args, { stdio: ["ignore", "inherit", "pipe"] });
  let err = ""; p.stderr.on("data", (d) => (err += d));
  p.on("close", (c) => (c ? rej(new Error(err.slice(-2000))) : res(err)));
});

const durOf = (f) => { const r = spawnSync(ffmpeg, ["-i", f], { encoding: "utf8" }); const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0; };
const D = durOf(video);

const inputs = [], chains = [];
cfg.cues.forEach((c, i) => {
  const f = find(c.sfx);
  const start = Math.max(0, c.t - (c.align === "peak" ? peakOffset(f) : 0));
  inputs.push("-i", f);
  const ms = Math.round(start * 1000);
  chains.push(`[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${c.gain ?? 0}dB,adelay=${ms}|${ms}[s${i}]`);
  console.log(`${c.t.toFixed(2)}s  ${c.sfx}${c.align === "peak" ? `  (starts ${start.toFixed(2)}s)` : ""}`);
});
const n = cfg.cues.length;
const mix = `${chains.join(";")};${Array.from({ length: n }, (_, i) => `[s${i}]`).join("")}amix=inputs=${n}:normalize=0:dropout_transition=0,atrim=0:${D}`;

// Pass 1: measure loudness of the mix.
const measure = await run(["-hide_banner", "-i", video, ...inputs, "-filter_complex", `${mix},loudnorm=I=${target}:TP=-1:LRA=20:print_format=json`, "-f", "null", "-"]);
const m = JSON.parse(measure.slice(measure.lastIndexOf("{"), measure.lastIndexOf("}") + 1));

// Pass 2: linear gain to target (no pumping), mux with the untouched video stream.
const norm = `loudnorm=I=${target}:TP=-1:LRA=20:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
await run(["-y", "-hide_banner", "-i", video, ...inputs, "-filter_complex", `${mix},${norm}[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out]);
console.log(`→ ${path.relative(process.cwd(), out)}  (measured ${m.input_i} LUFS → ${target})`);
