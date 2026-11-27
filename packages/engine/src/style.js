import { hash } from "./plan.js";

/** Independent axes. A seed fills any the model leaves blank, and always moves ground, camera, and shape. */
const AXES = {
  type: ["tight", "wide", "heavy", "light"],
  ease: ["spring", "snap", "glide"],
  ground: ["grid", "dots", "bands", "diagonal", "plain"],
  colour: ["type", "field", "line"],
  camera: ["push", "drift", "parallax"],
  shape: ["round", "sharp", "pill"],
  density: ["air", "pack"],
  pace: ["snap", "slow"],
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
  const rolled = styleFromSeed(seed);
  const chosen = { ...rolled, ...clean(given) };
  chosen.ground = rolled.ground;
  chosen.camera = rolled.camera;
  chosen.shape = clean(given).shape || rolled.shape;
  return chosen;
}

export const STYLE_AXES = AXES;
