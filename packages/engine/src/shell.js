import { esc } from "./copy.js";

const RUNTIME = `
const $ = (id) => document.getElementById(id);
const STATE = JSON.parse($("state").textContent);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
function ease(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const x1 = 0.16, y1 = 1, x2 = 0.3, y2 = 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const x = 3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid;
    if (x < t) lo = mid; else hi = mid;
  }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
}
function rise(el, p) {
  el.style.opacity = String(p);
  el.style.transform = "translateY(" + ((1 - p) * 30).toFixed(2) + "px)";
}
function play(scene, local, dur) {
  const kind = scene.dataset.play || "";
  if (kind === "bars" || kind === "chart") {
    scene.querySelectorAll("[data-h]").forEach((bar, i) => {
      const p = ease(clamp((local - 0.2 - i * 0.7) / 0.42));
      bar.style.height = ((+bar.dataset.h || 0) * p).toFixed(1) + "%";
    });
  }
  if (kind === "type" || kind === "search") {
    const lines = [...scene.querySelectorAll("[data-line]")];
    lines.forEach((line, i) => {
      const full = line.dataset.line || "";
      const start = 0.28 + i * 0.85;
      const p = ease(clamp((local - start) / 0.6));
      const n = Math.round(full.length * p);
      line.textContent = full.slice(0, n);
      const blink = (n < full.length && local >= start) || (i === lines.length - 1 && n === full.length && Math.sin(local * 10) > 0);
      line.style.borderRight = blink ? "3px solid currentColor" : "3px solid transparent";
    });
  }
  if (kind === "toggle") {
    const p = ease(clamp((local - 1.05) / 0.4));
    const track = scene.querySelector(".track");
    const knob = scene.querySelector(".knob");
    const preview = scene.querySelector(".preview");
    if (track) track.classList.toggle("on", p > 0.5);
    if (knob) knob.style.transform = "translateX(" + (p * 52).toFixed(1) + "px)";
    if (preview) {
      preview.textContent = p > 0.5 ? "On" : "Off";
      preview.classList.toggle("on", p > 0.5);
    }
  }
  if (kind === "chart") {
    scene.querySelectorAll("[data-count]").forEach((el) => {
      const p = ease(clamp((local - 0.25) / 1.1));
      el.textContent = Math.round((+el.dataset.count) * p) + (el.dataset.suffix || "");
    });
  }
  const seed = scene.querySelector("[data-seed]");
  if (seed && scene.dataset.tx === "scale") {
    const u = ease(clamp((local - (dur - 0.36)) / 0.36));
    if (u > 0) {
      const cover = Math.max(1920 / Math.max(seed.offsetWidth, 40), 1080 / Math.max(seed.offsetHeight, 40)) * 1.15;
      seed.style.transformOrigin = "50% 50%";
      seed.style.zIndex = "6";
      seed.style.transform = "scale(" + (1 + (cover - 1) * u).toFixed(3) + ")";
    }
  }
  if (seed && scene.dataset.tx === "morph") {
    const u = ease(clamp((local - (dur - 0.42)) / 0.42));
    if (u > 0) {
      const dx = 960 - (seed.offsetLeft + seed.offsetWidth / 2);
      const dy = 540 - (seed.offsetTop + seed.offsetHeight / 2);
      seed.style.zIndex = "6";
      seed.style.borderRadius = (12 + u * 220).toFixed(1) + "px";
      seed.style.transform = "translate(" + (dx * u).toFixed(1) + "px," + (dy * u).toFixed(1) + "px) scale(" + (1 - u * 0.84).toFixed(3) + ")";
    }
  }
}
function render(t) {
  let mode = "light";
  document.querySelectorAll(".scene").forEach((scene) => {
    const a = +scene.dataset.start;
    const b = +scene.dataset.end;
    const on = t >= a && t < b;
    scene.style.visibility = on ? "visible" : "hidden";
    scene.style.opacity = on ? "1" : "0";
    if (!on) return;
    mode = scene.dataset.mode || "light";
    const local = t - a;
    const dur = b - a;
    const zoom = 1 + ease(clamp(local / 3.6)) * (+scene.dataset.zoom || 0.04);
    let tx = 0;
    let blur = 0;
    let sc = zoom;
    if (scene.dataset.tx === "whip" && local < 0.42) {
      const p = ease(local / 0.42);
      tx = (1 - p) * 1100;
      if (1100 / 0.42 > 500) blur = (1 - p) * 14;
    }
    if (scene.dataset.tx === "cut" && local < 0.2) sc = zoom * (1.06 - 0.06 * ease(local / 0.2));
    const layer = scene.querySelector(".zoom");
    layer.style.transform = "translateX(" + tx.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
    layer.style.filter = blur > 0.4 ? "blur(" + blur.toFixed(2) + "px)" : "none";
    scene.querySelectorAll("[data-at]").forEach((el) => {
      if (el.classList.contains("deck") && scene.dataset.play === "cards" && local > dur * 0.5) return;
      rise(el, ease(clamp((local - +el.dataset.at) / 0.45)));
    });
    scene.querySelectorAll("[data-word]").forEach((el) => {
      rise(el, ease(clamp((local - +el.dataset.delay) / 0.45)));
    });
    play(scene, local, dur);
  });
  document.body.dataset.mode = mode;
  const grid = document.querySelector(".grid");
  if (grid) grid.style.transform = "translate(" + (Math.sin(t * 0.35) * 10).toFixed(1) + "px," + (Math.cos(t * 0.28) * 14).toFixed(1) + "px)";
}
window.render = render;
window.DUR = STATE.end;
addEventListener("message", (e) => {
  if (e.data && e.data.type === "harkat-t" && typeof e.data.t === "number") render(e.data.t);
});
function boot() {
  if (STATE.logo) document.querySelectorAll("img.logo").forEach((img) => { img.src = STATE.logo; });
  render(0);
  window.READY = true;
}
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(boot);
`;

function elHtml(el) {
  const cls = ["el", el.className].filter(Boolean).join(" ");
  const attrs = [
    `class="${cls}"`,
    "data-box",
    `data-id="${esc(el.id)}"`,
    el.area ? "data-area" : "",
    el.role ? `data-role="${el.role}"` : "",
    el.stack ? `data-stack="${esc(el.stack)}"` : "",
    el.inside ? `data-inside="${esc(el.inside)}"` : "",
    el.at != null ? `data-at="${el.at}"` : "",
    el.seed ? "data-seed" : "",
    `style="left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px${el.size ? `;font-size:${el.size}px` : ""}"`,
  ].filter(Boolean);
  return `<div ${attrs.join(" ")}>${el.html || ""}</div>`;
}

export function page({ font, accent, shots, logo }) {
  const safeFont = String(font || "/fonts/Geist-Variable.woff2").replace(/["'()\\\s]/g, "");
  const safeAccent = /^#[0-9A-F]{6}$/.test(accent) ? accent : "#111111";
  const body = shots
    .map((shot) => {
      const inner = shot.elements.map(elHtml).join("");
      const tone = shot.bg === "accent" ? " bleed" : shot.bg === "ink" ? " inkbg" : "";
      return `<section class="scene${shot.mode === "dark" ? " dark" : ""}${tone}" data-start="${shot.start}" data-end="${shot.end}" data-mode="${shot.mode}" data-tx="${shot.tx}" data-play="${shot.play}" data-zoom="${shot.zoom}"><div class="zoom">${inner}</div></section>`;
    })
    .join("");
  const end = shots.at(-1)?.end ?? 15;
  const state = JSON.stringify({ end, logo: logo || "" }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:G;src:url("${safeFont}") format("woff2");font-weight:100 900;font-display:swap}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:#F5F5F5;color:#111;font-family:G,sans-serif;-webkit-font-smoothing:antialiased}
body{--accent:${safeAccent}}
body[data-mode="dark"]{background:#111}
.grid{position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(17,17,17,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(17,17,17,.05) 1px,transparent 1px);background-size:120px 120px}
body[data-mode="dark"] .grid{background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)}
.grain{position:fixed;inset:0;width:1920px;height:1080px;pointer-events:none;opacity:.01}
.scene{position:absolute;inset:0;background:#F5F5F5;visibility:hidden;opacity:0}
.scene.dark,.scene.inkbg{background:#111;color:#F5F5F5}
.scene.bleed{background:var(--accent);color:#fff}
.scene.bleed .headline,.scene.bleed .sub{color:#fff}
.zoom{position:absolute;inset:0;transform-origin:50% 50%}
.el{position:absolute}
.headline{font-weight:800;font-size:118px;letter-spacing:-.05em;line-height:1;color:#111;white-space:nowrap;text-align:center}
.sub{font-weight:400;font-size:28px;line-height:1.15;color:#111;white-space:nowrap;text-align:center}
.word{display:inline-block;opacity:0}
.pill{background:var(--accent);color:#fff;border-radius:10px;padding:0 .18em}
.card{background:#fff;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,.05);color:#111}
.scene.dark .card{background:#1E1E1E;color:#F5F5F5;box-shadow:0 20px 40px rgba(0,0,0,.35)}
.meter{display:flex;align-items:flex-end;gap:36px;width:100%;height:150px;padding:0 8px}
.meter.tall{height:250px}
.meter i{flex:1;height:0;border-radius:10px;background:#E4E4E4;display:block}
.scene.dark .meter i{background:#333}
.meter i[data-hot]{background:var(--accent)}
.bars{display:flex;align-items:flex-end;padding:40px 64px 48px}
.code{display:flex;flex-direction:column;justify-content:center;gap:16px;width:100%;height:100%;padding:0 72px;font:600 44px/1.15 G,sans-serif;color:inherit;text-align:left}
.code span{display:block;padding-right:8px}
.codeCard{display:flex;align-items:center}
.search,.toggle,.chat,.cta{display:flex;align-items:center;justify-content:center}
.search{flex-direction:column;align-items:stretch;padding:36px 48px;gap:16px}
.rows{display:flex;flex-direction:column;gap:12px}
.srow{font:600 36px/1.1 G,sans-serif;letter-spacing:-.03em;padding-top:8px;border-top:2px solid #E4E4E4}
.result{display:block;margin-top:8px;color:var(--accent);font:600 40px/1.1 G,sans-serif}
.preview{font:600 36px/1 G,sans-serif;border-radius:12px;padding:10px 22px;background:#EFEFEF}
.preview.on{background:var(--accent);color:#fff}
.metric{font:800 96px/0.9 G,sans-serif;letter-spacing:-.05em}
.metricCard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:36px 48px}
.note{font-size:28px;font-weight:400}
.toggle{flex-direction:column;gap:20px;padding:32px 48px}
.query{font:600 44px/1 G,sans-serif;letter-spacing:-.03em;display:flex;align-items:center;gap:8px}
.caret{display:inline-block;width:3px;height:.85em;background:currentColor;margin-left:4px;vertical-align:-2px}
.tog{width:100%;padding:0 56px;display:flex;align-items:center;justify-content:space-between;gap:32px}
.tog span{font:600 40px/1.1 G,sans-serif;letter-spacing:-.03em}
.track{width:112px;height:64px;border-radius:99px;background:#E6E6E6;position:relative;flex:none}
.track.on{background:var(--accent)}
.knob{position:absolute;top:8px;left:8px;width:48px;height:48px;border-radius:99px;background:#fff}
.bubble{font:600 44px/1.15 G,sans-serif;letter-spacing:-.03em;padding:0 36px;text-align:center}
.deck{display:flex;align-items:center;justify-content:center}
.deckWord{font:600 44px/1 G,sans-serif;letter-spacing:-.03em;color:#111}
.ctaIn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;width:100%;height:100%}
.host,.mark{font-size:28px;font-weight:400;color:#111}
.btn{background:var(--accent);color:#fff;border-radius:12px;min-width:220px;height:76px;padding:0 36px;display:flex;align-items:center;justify-content:center;font:600 36px/1 G,sans-serif}
img.logo{width:96px;height:96px;object-fit:contain;display:block}
.logobox{display:flex;align-items:center;justify-content:center}
[data-at]{opacity:0}
[data-seed]{transform-origin:50% 50%}
</style></head><body data-mode="light">
<div class="grid" data-fx></div>
<svg class="grain" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
${body}
<script id="state" type="application/json">${state}</script>
<script>${RUNTIME}</script>
</body></html>`;
}
