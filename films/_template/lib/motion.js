// Harkat film helpers — extracted from hero-film/film.html.
// Everything is a pure function of t (seconds) so every frame is deterministic.
// Rules: 2D camera only (push, pan, zoom, whip) + blob portals. No 3D, no iris/circle wipes.

const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a)); // 0→1 progress of t across [a, b]
const lerp = (a, b, p) => a + (b - a) * p;

// Easings
const eo = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)); // expo out
const q5 = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2); // quint in-out
const q3 = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - Math.pow(-2 * p + 2, 3) / 2); // cubic in-out
const ei = (p) => p * p * p * p; // quart in
const bo = (p) => { p = clamp(p); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }; // back out

// Kinetic text: words rise in one by one and the line reflows to stay centred.
// mkReflow(el, [['Word'], ['word', 'blue']]) once; reflow(R, t, [t0, t1, ...], outTime) per frame.
function mkReflow(el, list) {
  const spans = list.map(([w, c]) => { const s = document.createElement("span"); s.textContent = w; if (c) s.className = c; el.appendChild(s); return s; });
  const ws = spans.map((s) => s.getBoundingClientRect().width);
  const sp = parseFloat(getComputedStyle(el).fontSize) * 0.26;
  return { spans, ws, sp };
}
function reflow(R, t, times, out) {
  const pr = times.map((ti) => eo(seg(t, ti, ti + 0.5)));
  let W = 0; pr.forEach((p, i) => (W += (R.ws[i] + (i ? R.sp : 0)) * p));
  let x = -W / 2; const o = out == null ? 0 : q5(seg(t, out, out + 0.4));
  R.spans.forEach((s, i) => {
    const p = pr[i]; const w = (R.ws[i] + (i ? R.sp : 0)) * p; const left = x + (i ? R.sp * p : 0); x += w;
    s.style.left = left + "px"; s.style.opacity = clamp(p * 1.4) * (1 - o);
    s.style.transform = `translateY(${(1 - p) * 60 - o * 60}px) scale(${lerp(0.55, 1, p)})`;
    s.style.filter = `blur(${(1 - p) * 10 + o * 10}px)`;
  });
  return W;
}

// Organic blob portal: returns an SVG path for a wobbly circle. Grow r 0→2600 over a cut,
// use it as a clipPath on the next layer. wob ~0.2 while small, ~0.04 when settled.
function blob(cx, cy, r, t, wob) {
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + wob * (Math.sin(a * 3 + t * 4) * 0.6 + Math.sin(a * 5 - t * 3) * 0.4));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d + "Z";
}

// 2D camera. Keys: [{t, x, y, s}] — x/y are the point in the scene to centre, s is zoom.
// Between keys it eases with `ease` (default quint in-out). Apply to a 1920x1080 stage element.
function camera(el, t, keys, ease = q5, W = 1920, H = 1080) {
  let k = keys[0];
  let x = k.x, y = k.y, s = k.s;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t >= a.t) { const p = ease(seg(t, a.t, b.t)); x = lerp(a.x, b.x, p); y = lerp(a.y, b.y, p); s = lerp(a.s, b.s, p); }
  }
  el.style.transformOrigin = "0 0";
  el.style.transform = `translate(${W / 2 - x * s}px, ${H / 2 - y * s}px) scale(${s})`;
}

// Whip pan: horizontal motion blur that peaks mid-transition. Returns px of blur for filter.
const whipBlur = (t, a, b, max = 40) => Math.sin(Math.PI * seg(t, a, b)) * max;

Object.assign(window, { $, clamp, seg, lerp, eo, q5, q3, ei, bo, mkReflow, reflow, blob, camera, whipBlur });
