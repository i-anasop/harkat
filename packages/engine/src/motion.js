/**
 * One motion library for every template.
 * The same numbers are written into the film runtime in shell.js.
 * Timings are milliseconds. Templates convert with sec() and beats().
 */

export const MS = {
  word: 280,
  letter: 45,
  fade: 420,
  slide: 680,
  stagger: 160,
  count: 1100,
  /** A layer keeps moving. No frame is fully frozen longer than this. */
  drift: 400,
  hook: 3000,
  press: 160,
  push: 8,
};

/** 8-based spacing, in px. Index 1 is 8. */
export const SPACE = [0, 8, 12, 16, 24, 32, 48, 64];

export const sec = (ms) => +(ms / 1000).toFixed(2);

/** Start times for a staggered row, in seconds. */
export function beats(startSec, count, everyMs = MS.stagger) {
  const start = startSec * 1000;
  return Array.from({ length: count }, (_, i) => sec(start + i * everyMs));
}

export const easeOut = (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));

export const easeInOut = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2);

/** 2D overshoot. Settles at 1. Never used as a 3D rotation. */
export const backOut = (p) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
};
