import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const run = (args) =>
  new Promise((res, rej) => {
    const p = spawn(ffmpeg, args, { stdio: ["ignore", "inherit", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c ? rej(new Error(err.slice(-1500))) : res(err)));
  });

function durationOf(file) {
  const r = spawnSync(ffmpeg, ["-i", file], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
}

function peakOffset(file) {
  const r = spawnSync(ffmpeg, ["-v", "error", "-i", file, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], {
    maxBuffer: 1 << 26,
  });
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
  let max = 0;
  let at = 0;
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.abs(pcm[i]);
    if (v > max) {
      max = v;
      at = i;
    }
  }
  return at / 8000;
}

/** Lay sound effects on a silent film and set the mix to about -22 LUFS. Never music. */
export async function mix({ video, cues, sfxDir, out, target = -22 }) {
  mkdirSync(path.dirname(out), { recursive: true });
  const inputs = [];
  const chains = [];
  cues.forEach((c, i) => {
    const file = path.join(sfxDir, `${c.sfx}.wav`);
    const start = Math.max(0, c.t - (c.align === "peak" ? peakOffset(file) : 0));
    inputs.push("-i", file);
    const ms = Math.round(start * 1000);
    chains.push(`[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${c.gain ?? 0}dB,adelay=${ms}|${ms}[s${i}]`);
  });
  const n = cues.length;
  const D = durationOf(video).toFixed(3);
  const mixChain = `${chains.join(";")};${Array.from({ length: n }, (_, i) => `[s${i}]`).join("")}amix=inputs=${n}:normalize=0:dropout_transition=0,apad,atrim=0:${D}`;
  const measure = await run([
    "-hide_banner",
    "-i",
    video,
    ...inputs,
    "-filter_complex",
    `${mixChain},loudnorm=I=${target}:TP=-1.5:LRA=11:print_format=json`,
    "-f",
    "null",
    "-",
  ]);
  const json = JSON.parse(measure.slice(measure.lastIndexOf("{"), measure.lastIndexOf("}") + 1));
  const norm = `loudnorm=I=${target}:TP=-1.5:LRA=11:measured_I=${json.input_i}:measured_TP=${json.input_tp}:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset}:linear=true,aresample=48000`;
  await run([
    "-y",
    "-hide_banner",
    "-i",
    video,
    ...inputs,
    "-filter_complex",
    `${mixChain},${norm}[a]`,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-t",
    D,
    out,
  ]);
  const after = await integrated(out);
  const delta = target - after;
  if (Math.abs(delta) > 0.35) {
    const fixed = `${out}.level.mp4`;
    await run([
      "-y",
      "-hide_banner",
      "-i",
      out,
      "-c:v",
      "copy",
      "-af",
      `volume=${delta.toFixed(2)}dB`,
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      fixed,
    ]);
    renameSync(fixed, out);
  }
  return { measured: json.input_i, output: after + (Math.abs(delta) > 0.35 ? delta : 0), target, out };
}

async function integrated(file) {
  const text = await run(["-hide_banner", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  const json = JSON.parse(text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1));
  return Number(json.input_i);
}
