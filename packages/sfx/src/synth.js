import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const RATE = 48000;

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return buf;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function take(seconds, fill) {
  const n = Math.floor(RATE * seconds);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = fill(i / RATE, i / n, i);
  return out;
}

/** One-shots only. Seeded noise so a re-render sounds the same. No melody, no bed. */
const sounds = {
  tick() {
    return take(0.045, (t) => Math.sin(2 * Math.PI * 2450 * t) * Math.exp(-t * 70) * 0.8);
  },
  click() {
    const rand = rng(3);
    return take(0.05, (t) => {
      const n = rand() * 2 - 1;
      return (n * Math.exp(-t * 160) * 0.85 + Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t * 80) * 0.4);
    });
  },
  ui() {
    const rand = rng(11);
    return take(0.09, (t) => {
      const n = rand() * 2 - 1;
      return (Math.sin(2 * Math.PI * 1320 * t) * 0.45 + n * 0.25) * Math.exp(-t * 36);
    });
  },
  whoosh() {
    const rand = rng(7);
    let low = 0;
    let mid = 0;
    let high = 0;
    return take(0.62, (t, p) => {
      const env = Math.sin(Math.PI * p) ** 0.7;
      low += (0.015 + p * 0.04) * (rand() * 2 - 1 - low);
      mid += (0.06 + p * 0.28) * (rand() * 2 - 1 - mid);
      high += (0.18 + p * 0.5) * (rand() * 2 - 1 - high);
      const body = Math.sin(2 * Math.PI * (160 + 380 * p) * t) * 0.12 * (1 - p);
      return (low * 1.1 + mid * 0.85 + high * 0.4 + body) * env;
    });
  },
  chime() {
    return take(0.55, (t) => (Math.sin(2 * Math.PI * 880 * t) * 0.5 + Math.sin(2 * Math.PI * 1320 * t) * 0.22) * Math.exp(-t * 5.5));
  },
  thud() {
    const rand = rng(19);
    return take(0.38, (t) => (Math.sin(2 * Math.PI * 78 * t) * 0.9 + (rand() * 2 - 1) * Math.exp(-t * 50) * 0.35) * Math.exp(-t * 8));
  },
};

export function synthKit(dir) {
  mkdirSync(dir, { recursive: true });
  for (const [name, make] of Object.entries(sounds)) {
    const samples = make();
    let peak = 0;
    for (const s of samples) peak = Math.max(peak, Math.abs(s));
    const gain = peak > 0 ? 0.9 / peak : 1;
    writeFileSync(path.join(dir, `${name}.wav`), wav(samples.map((s) => s * gain)));
  }
  return dir;
}
