/** Positions come from the frame, then a bounding-box check. Overlap fails the build. */

export const FRAME_W = 1920;
export const FRAME_H = 1080;
export const FRAME_AREA = FRAME_W * FRAME_H;
/** Reveal travel. Gaps stay larger than this so a rising line cannot cross the next box. */
export const REVEAL = 30;
export const GAP = 72;

export function intersects(a, b, gap = 12) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

export function contains(outer, inner) {
  return inner.x >= outer.x - 1 && inner.y >= outer.y - 1 && inner.x + inner.w <= outer.x + outer.w + 1 && inner.y + inner.h <= outer.y + outer.h + 1;
}

export function assertClear(elements) {
  const list = elements.filter((e) => e && e.w > 0 && e.h > 0);
  for (const el of list) {
    if (!el.inside) continue;
    const parent = list.find((p) => p.id === el.inside);
    if (!parent || !contains(parent, el)) {
      throw new Error(`Layout ${el.id} is marked inside ${el.inside} but sits outside it. The film was not rendered.`);
    }
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (a.stack && a.stack === b.stack) continue;
      if (a.inside && a.inside === b.id) continue;
      if (b.inside && b.inside === a.id) continue;
      if (a.inside && b.inside && a.inside === b.inside) continue;
      if (intersects(a, b, 12)) {
        throw new Error(`Layout overlap between ${a.id} and ${b.id}. The film was not rendered.`);
      }
    }
  }
  return list;
}

export function stack(items, gap = GAP) {
  const total = items.reduce((sum, it) => sum + it.h, 0) + gap * Math.max(0, items.length - 1);
  let y = Math.round((FRAME_H - total) / 2);
  return items.map((it) => {
    const placed = { ...it, x: Math.round((FRAME_W - it.w) / 2), y };
    y += it.h + gap;
    return placed;
  });
}

export function row(items, gap, y) {
  const total = items.reduce((sum, it) => sum + it.w, 0) + gap * Math.max(0, items.length - 1);
  let x = Math.round((FRAME_W - total) / 2);
  return items.map((it) => {
    const placed = { ...it, x, y };
    x += it.w + gap;
    return placed;
  });
}

export function contentRatio(elements) {
  const area = elements.filter((e) => e.area).reduce((sum, e) => sum + e.w * e.h, 0);
  return area / FRAME_AREA;
}
