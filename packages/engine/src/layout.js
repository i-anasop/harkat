/** Deterministic layout. The same brief always picks the same variant. */

export function briefHash(brief) {
  const s = [brief.name, brief.problem, ...(brief.features || [])].join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function layoutVariant(brief) {
  return briefHash(brief) % 3;
}

/** Three loose rings. Cards overlap. The center is left open for a headline. */
const RINGS = [
  [[70, 160], [1460, 110], [30, 660], [1480, 690], [500, 80], [960, 750], [160, 390], [1220, 280]],
  [[140, 100], [1340, 170], [60, 710], [1400, 620], [620, 36], [840, 780], [240, 430], [1080, 250]],
  [[20, 210], [1520, 70], [90, 760], [1340, 730], [680, 48], [460, 790], [280, 320], [1160, 340]],
];

export function ringSlots(count, variant = 0) {
  const base = RINGS[variant % 3];
  return Array.from({ length: count }, (_, i) => base[i % base.length]);
}

/**
 * A ring with one hero card kept fully on screen.
 * A band in the middle stays clear for the readable name.
 */
export function constellation(count, variant = 0, heroIndex = 0) {
  const hero = [1120, 240];
  const clear = { x: 660, y: 390, w: 600, h: 200 };
  const placed = ringSlots(count, variant).map(([x, y], i) => {
    if (i === heroIndex) return hero;
    let px = Math.max(760, Math.min(1540, x));
    let py = Math.max(88, Math.min(800, y));
    const hits = px < clear.x + clear.w && px + 340 > clear.x && py < clear.y + clear.h && py + 210 > clear.y;
    if (hits) py = py < 500 ? 120 : 700;
    const overX = Math.min(px + 340, hero[0] + 460) - Math.max(px, hero[0]);
    const overY = Math.min(py + 230, hero[1] + 380) - Math.max(py, hero[1]);
    if (overX > 28 && overY > 28) {
      const cardMid = px + 170;
      const heroMid = hero[0] + 230;
      px = cardMid < heroMid ? Math.max(24, hero[0] - 360) : Math.min(1540, hero[0] + 484);
    }
    return [px, Math.max(88, Math.min(800, py))];
  });
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < placed.length; i++) {
      if (i === heroIndex) continue;
      for (let j = 0; j < i; j++) {
        if (j === heroIndex) continue;
        const a = placed[i];
        const b = placed[j];
        const ox = Math.min(a[0] + 340, b[0] + 340) - Math.max(a[0], b[0]);
        const oy = Math.min(a[1] + 140, b[1] + 140) - Math.max(a[1], b[1]);
        if (ox > 16 && oy > 8) a[1] = Math.min(800, Math.max(a[1], b[1] + 210));
      }
    }
  }
  return placed;
}

/** Same ring, pulled inward so a short list overlaps instead of sitting in the corners. */
export function clusterSlots(count, variant = 0) {
  const pull = [0.55, 0.48, 0.62][variant % 3];
  return ringSlots(count, variant).map(([x, y]) => [
    Math.round(640 + (x - 700) * pull),
    Math.round(180 + (y - 300) * pull),
  ]);
}

/** Front card is sharp and full size. Back cards are smaller and blurred. 2D only. */
export function depthFor(index, heroIndex) {
  if (index === heroIndex) return { depth: 0, scale: 1, z: 8 };
  const band = index % 3;
  if (band === 0) return { depth: 2.4, scale: 0.76, z: 2 };
  if (band === 1) return { depth: 1.1, scale: 0.9, z: 5 };
  return { depth: 1.7, scale: 0.84, z: 3 };
}

export function slideDir(variant) {
  if (variant % 3 === 1) return { from: 980, to: -1500 };
  if (variant % 3 === 2) return { from: -200, to: 1700 };
  return { from: -1200, to: 860 };
}
