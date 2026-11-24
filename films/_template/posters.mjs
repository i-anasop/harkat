// Prepare Pond films for the website (step 6).
// Usage (from films/):  npm run posters -- <folder with the 4 MP4s>
// Expects files named by slug: pond-for-ai-agents.mp4, meet-pond-ai.mp4, pond-bot-launch.mp4, whatsapp-booking-agent.mp4
// Writes to web/public/films/: <slug>.mp4 (full film), <slug>-loop.mp4 (6.6s page loop), <slug>.jpg (poster),
// results-loop.mp4/.jpg (7.2s, silent).
// The site only shows them when NEXT_PUBLIC_SHOW_POND_WORK=true (after Dylan approves).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const SLUGS = ["pond-for-ai-agents", "meet-pond-ai", "pond-bot-launch", "whatsapp-booking-agent"];
const src = path.resolve(process.argv[2] ?? "pond");
const dest = path.resolve(import.meta.dirname, "..", "..", "apps", "web", "public", "films");
// Seconds into each film for the poster frame (pick a moment where the frame is complete).
const POSTER_AT = { "pond-for-ai-agents": 21, "meet-pond-ai": 3, "pond-bot-launch": 24.5, "whatsapp-booking-agent": 21 };
const CLIP = 1.8; // s per film in the Results loop → 4 × 1.8 = 7.2s
mkdirSync(dest, { recursive: true });

const ff = (args) => {
  const r = spawnSync(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (r.status) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
};

function probeDuration(file) {
  const r = spawnSync(ffmpeg, ["-i", file], { encoding: "utf8" });
  const m = /Duration: (d+):(d+):([d.]+)/.exec(r.stderr);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 30;
}

const files = SLUGS.map((s) => path.join(src, `${s}.mp4`));
const missing = files.filter((f) => !existsSync(f));
if (missing.length) throw new Error(`Missing:\n${missing.join("\n")}`);

for (const [i, s] of SLUGS.entries()) {
  // Full film for the player box: 1080p with its sound mix, fast start. Only loaded when someone presses play.
  ff(["-i", files[i], "-vf", "scale=-2:1080", "-c:v", "libx264", "-crf", "24", "-maxrate", "3000k", "-bufsize", "6000k", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", path.join(dest, `${s}.mp4`)]);
  ff(["-ss", String(POSTER_AT[s] ?? 3), "-i", files[i], "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", path.join(dest, `${s}.jpg`)]);
  // Page loop: three 2.2s moments (≈25%, 50%, 75% in) cut together — 6.6s, silent, ~0.5 MB.
  const dur = probeDuration(files[i]);
  const at = [0.25, 0.5, 0.75].map((p) => (dur * p).toFixed(2));
  ff([...at.flatMap((a) => ["-ss", a, "-t", "2.2", "-i", files[i]]), "-filter_complex",
    `${at.map((_, k) => `[${k}:v]scale=-2:720,fps=30,setsar=1[c${k}]`).join(";")};${at.map((_, k) => `[c${k}]`).join("")}concat=n=${at.length}:v=1:a=0[v]`,
    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "27", "-maxrate", "1200k", "-bufsize", "2400k", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dest, `${s}-loop.mp4`)]);
  console.log(`✓ ${s}`);
}

// Results loop: a short cut from each film, joined, silent, small.
const inputs = files.flatMap((f, i) => ["-ss", String(Math.max(0, (POSTER_AT[SLUGS[i]] ?? 3) - 0.6)), "-t", String(CLIP), "-i", f]);
const chain = SLUGS.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,setsar=1[v${i}]`).join(";");
ff([...inputs, "-filter_complex", `${chain};${SLUGS.map((_, i) => `[v${i}]`).join("")}concat=n=${SLUGS.length}:v=1:a=0[v]`, "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dest, "results-loop.mp4")]);
ff(["-i", path.join(dest, "results-loop.mp4"), "-frames:v", "1", "-q:v", "3", path.join(dest, "results-loop.jpg")]);
console.log(`✓ results-loop (${(SLUGS.length * CLIP).toFixed(1)}s) → ${dest}`);
