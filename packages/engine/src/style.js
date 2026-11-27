import { hash } from "./plan.js";

/** Independent axes. A seed fills any the model leaves blank. A set axis stays, so a studio can be pinned. */
const AXES = {
  type: ["tight", "wide", "heavy", "light"],
  ease: ["spring", "snap", "glide"],
  ground: ["grid", "dots", "bands", "diagonal", "plain"],
  colour: ["type", "field", "line"],
  camera: ["push", "drift", "parallax"],
  shape: ["round", "sharp", "pill"],
  density: ["air", "pack"],
  pace: ["snap", "slow"],
  face: ["sans", "mono", "display"],
};

function pick(list, seed, salt) {
  return list[hash(`${seed}|${salt}`) % list.length];
}

export function styleFromSeed(seed = "0") {
  const style = {};
  for (const [axis, list] of Object.entries(AXES)) style[axis] = pick(list, seed, axis);
  return style;
}

function clean(given) {
  const out = {};
  if (!given || typeof given !== "object") return out;
  for (const [axis, list] of Object.entries(AXES)) {
    if (list.includes(given[axis])) out[axis] = given[axis];
  }
  return out;
}

export function resolveStyle(seed, given) {
  return { ...styleFromSeed(seed), ...clean(given) };
}

export const STYLE_AXES = AXES;
