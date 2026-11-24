import { buildShots } from "./scenes.js";
import { rulePlan } from "./plan.js";
import { page } from "./shell.js";

const SFX = ["whoosh", "tick", "ui", "click", "thud"];

export function buildFilm(brief, opts = {}) {
  const plan = opts.plan || rulePlan(brief);
  const accent = /^#[0-9A-Fa-f]{6}$/.test(brief.accent) ? brief.accent.toUpperCase() : "#111111";
  const shots = buildShots(brief, { ...plan, length: brief.length });
  const html = page({ font: opts.fontUrl, accent, shots, logo: brief.logo });
  const events = shots.map((shot, i) => ({
    t: shot.start,
    sfx: shot.kind === "cta" ? "chime" : shot.play === "bars" || shot.play === "chart" ? "tick" : SFX[i % SFX.length],
    align: "peak",
  }));
  return {
    html,
    duration: brief.length,
    events,
    hostname: brief.hostname,
    template: brief.goal,
    goal: brief.goal,
    length: brief.length,
    accent,
    shots: shots.map(({ kind, play, mode, start, dur, ratio, words }) => ({ kind, play, mode, start, dur, ratio, words: words.length })),
  };
}
