import { esc, clipWords, lineSize } from "./copy.js";
import { assertClear, stack } from "./layout.js";
import { hash } from "./plan.js";

const W = 1920;
const H = 1080;

export function onAccent(hex) {
  const n = Number.parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return "#FFFFFF";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.64 ? "#141414" : "#FFFFFF";
}

function fitSize(words, maxW, size, min = 48) {
  let next = size;
  while (next > min && lineSize(words, next, 600).w > maxW) next -= 4;
  return next;
}

function wordsBlock(words, highlight, motion) {
  return words
    .map((word, index) => {
      const hi = highlight && word.toLowerCase() === highlight.toLowerCase();
      const cls = hi ? "word hi" : "word";
      if (motion === "letters") {
        const chars = [...word].map((ch) => `<span class="chm"><span class="ch">${esc(ch)}</span></span>`).join("");
        return `<span class="${cls}" data-i="${index}">${chars}</span>`;
      }
      return `<span class="${cls}" data-i="${index}">${esc(word)}</span>`;
    })
    .join('<span class="gap"> </span>');
}

function textEl(id, words, size, motion, highlight, className = "big") {
  const box = lineSize(words, size, 600);
  return {
    id,
    className,
    w: box.w,
    h: box.h,
    size,
    motion,
    html: wordsBlock(words, highlight, motion),
  };
}

function box(id, x, y, w, h, html, extra = {}) {
  return { id, x, y, w, h, html, ...extra };
}

function tileWord(shot) {
  const words = shot.copy.split(" ").filter((word) => word.length > 1);
  const hi = words.find((word) => word.toLowerCase() === String(shot.highlight || "").toLowerCase());
  return hi || words.slice().sort((a, b) => a.length - b.length)[0] || shot.copy;
}

function rowsOf(shot, brief) {
  if (shot.rows?.length) return shot.rows.slice(0, 3);
  return (brief.features || []).map((feature) => clipWords(feature, 3).join(" ")).filter(Boolean).slice(0, 3);
}

function fills(seed) {
  const pattern = [46, 72, 100];
  const spin = hash(String(seed)) % 3;
  return pattern.map((_, index) => pattern[(index + spin) % 3]);
}

function lanes(rows, seed, hot) {
  const levels = fills(seed);
  return rows
    .map((row, index) => {
      const last = index === rows.length - 1;
      const level = hot && last ? 100 : levels[index % levels.length];
      const mark = hot && last ? " data-hot=\"1\"" : "";
      return `<div class="lane" data-i="${index}"><span class="lab">${esc(row)}</span><span class="track"><b data-h="${level}"${mark}></b></span></div>`;
    })
    .join("");
}

function windowChrome(title) {
  return `<div class="chrome"><i></i><i></i><i></i><b>${esc(title)}</b></div>`;
}

function layoutOf(shot, brief, index, seed) {
  const words = shot.copy.split(" ").filter(Boolean);
  const motion = shot.motion || "rise";
  const textMotion = ["letters", "mask", "rise", "scale"].includes(motion) ? motion : "letters";
  const rows = rowsOf(shot, brief);
  const name = clipWords(brief.name, 2).join(" ") || words[0];

  if (shot.layout === "split") {
    const size = fitSize(words, 740, 72, 32);
    const line = textEl(`s${index}-line`, words, size, textMotion, shot.highlight);
    line.w = Math.min(line.w, 740);
    const y = Math.round((H - line.h) / 2);
    const card = box(
      `s${index}-win`,
      980,
      170,
      840,
      740,
      `<div class="win">${windowChrome(name)}<div class="lines">${rows.map((row, i) => `<div data-line="${esc(row)}" data-i="${i}"></div>`).join("")}</div><div class="cursor" data-cursor></div></div>`,
      { motion: "type", className: "card" },
    );
    return [box(`s${index}-line`, 100, y, line.w, line.h, line.html, { motion: textMotion, className: "big", size: line.size }), card];
  }

  if (shot.layout === "checklist") {
    const size = fitSize(words, 700, 68, 32);
    const line = textEl(`s${index}-line`, words, size, textMotion, shot.highlight);
    line.w = Math.min(line.w, 700);
    const y = Math.round((H - line.h) / 2);
    const card = box(
      `s${index}-list`,
      960,
      220,
      820,
      640,
      `<div class="win list">${rows
        .map(
          (row, i) =>
            `<div class="check" data-i="${i}"><span class="box"><svg viewBox="0 0 24 24"><path data-check d="M5 13 L10 18 L19 7"/></svg></span><span>${esc(row)}</span></div>`,
        )
        .join("")}</div>`,
      { motion: "stagger", className: "card" },
    );
    return [box(`s${index}-line`, 110, y, line.w, line.h, line.html, { motion: textMotion, className: "big", size: line.size }), card];
  }

  if (shot.layout === "grid") {
    const size = fitSize(words, 1400, 72, 40);
    const kinds = Array.from({ length: 12 }, (_, i) => {
      const roll = hash(`${seed}:tile:${i}`) % 6;
      return roll === 0 ? "fill" : roll === 1 ? "ink" : "line";
    });
    kinds[5] = "word";
    const tiles = `<div class="tiles">${kinds
      .map((kind, i) => `<i class="tile ${kind}" data-i="${i}">${kind === "word" ? esc(tileWord(shot)) : ""}</i>`)
      .join("")}</div>`;
    const grid = { id: `s${index}-grid`, className: "gridbox", w: 726, h: 540, motion: "stagger", html: tiles };
    return stack([textEl(`s${index}-line`, words, size, "letters", shot.highlight), grid], 40);
  }

  if (shot.layout === "meter") {
    const size = fitSize(words, 1400, 84, 48);
    const head = textEl(`s${index}-line`, words, size, "letters", shot.highlight);
    const card = {
      id: `s${index}-meter`,
      className: "card meter",
      w: 1180,
      h: 460,
      motion: "stagger",
      html: `<div class="meterIn">${lanes(rows.length ? rows : [shot.copy], seed, true)}</div>`,
    };
    return stack([head, card], 48);
  }

  if (shot.layout === "dashboard") {
    const card = box(
      `s${index}-dash`,
      400,
      180,
      1120,
      720,
      `<div class="win">${windowChrome(name)}<div class="body">${rows
        .map((row, i) => `<div class="lane" data-i="${i}"><i class="sq"></i><span class="lab">${esc(row)}</span><span class="track"><b data-h="${fills(seed)[i % 3]}"${i === 1 ? " data-hot=\"1\"" : ""}></b></span></div>`)
        .join("")}</div><div class="cursor" data-cursor></div></div>`,
      { motion: "stagger", className: "card" },
    );
    return [card];
  }

  if (shot.layout === "search") {
    const hits = rows.filter((row) => row.toLowerCase() !== shot.copy.toLowerCase()).slice(0, 3);
    const card = box(
      `s${index}-search`,
      390,
      220,
      1140,
      640,
      `<div class="win">${windowChrome(name)}<div class="field"><span data-line="${esc(shot.copy)}"></span></div><div class="hits">${hits
        .map((row, i) => `<div class="hit" data-i="${i}">${esc(row)}</div>`)
        .join("")}</div></div>`,
      { motion: "stagger", className: "card" },
    );
    return [card];
  }

  if (shot.layout === "counter") {
    const found = shot.copy.match(/\d+(?:\.\d+)?/);
    const num = found ? found[0] : "0";
    const suffix = shot.copy.includes("%") ? "%" : "";
    const label = shot.copy.replace(/\d+(?:\.\d+)?%?/, "").replace(/\s+/g, " ").trim();
    const figureWords = [`${num}${suffix}`];
    const size = fitSize(figureWords, 1500, 220, 120);
    const figure = {
      id: `s${index}-num`,
      className: "figure",
      w: lineSize(figureWords, size, 600).w,
      h: Math.ceil(size * 1.05),
      size,
      motion: "count",
      html: `<span data-count="${esc(num)}" data-suffix="${esc(suffix)}">0${esc(suffix)}</span>`,
    };
    const items = [];
    if (label) {
      const bits = label.split(" ").filter(Boolean);
      const subSize = fitSize(bits, 1200, 36, 24);
      items.push(textEl(`s${index}-lab`, bits, subSize, "rise", "", "subline"));
    }
    items.push(figure);
    return stack(items, 28);
  }

  if (shot.layout === "flow") {
    const hub = clipWords(brief.name, 1)[0] || words[0];
    const nodes = [
      { x: 220, y: 140, label: rows[0] || shot.copy },
      { x: 1060, y: 160, label: rows[1] || rows[0] || shot.copy },
      { x: 640, y: 540, label: rows[2] || rows[0] || shot.copy },
    ];
    const cx = 640;
    const cy = 280;
    const lines = nodes.map((node) => `<line data-draw x1="${cx}" y1="${cy}" x2="${node.x}" y2="${node.y}"/>`).join("");
    const dots = nodes.map((node) => `<circle cx="${node.x}" cy="${node.y}" r="12"/>`).join("");
    const labels = nodes.map((node) => `<text x="${node.x}" y="${node.y + 46}" text-anchor="middle">${esc(node.label)}</text>`).join("");
    const svg = `<svg class="flow" viewBox="0 0 1280 680">${lines}<circle class="hub" cx="${cx}" cy="${cy}" r="84"/>${dots}<text class="hubt" x="${cx}" y="${cy + 10}" text-anchor="middle">${esc(hub)}</text>${labels}</svg>`;
    return [box(`s${index}-flow`, 320, 180, 1280, 720, svg, { motion: "draw", className: "flowbox" })];
  }

  if (shot.layout === "ticker") {
    const size = fitSize(words, 1500, 108, 56);
    const head = textEl(`s${index}-line`, words, size, "letters", shot.highlight);
    const bits = (rows.length ? rows : [shot.copy]).slice(0, 4);
    const line = new Array(6).fill(bits.join("    ·    ")).join("    ·    ");
    const band = {
      id: `s${index}-band`,
      className: "band",
      w: 1600,
      h: 120,
      motion: "ticker",
      html: `<div class="marquee" data-ticker>${esc(line)}</div>`,
    };
    return stack([head, band], 160);
  }

  if (shot.layout === "lockup") {
    const items = [];
    if (brief.logo) items.push({ id: `s${index}-logo`, className: "logobox", w: 112, h: 112, motion: "rise", html: `<img class="logo" alt="">` });
    const kick = ["Introducing"];
    items.push(textEl(`s${index}-kick`, kick, 22, "rise", "", "kicker"));
    const size = fitSize(words, 1500, 120, 64);
    items.push(textEl(`s${index}-line`, words, size, textMotion === "rise" ? "mask" : textMotion, shot.highlight));
    return stack(items, 28);
  }

  if (shot.layout === "end") {
    const items = [];
    if (brief.logo) items.push({ id: `s${index}-logo`, className: "logobox", w: 96, h: 96, motion: "rise", html: `<img class="logo" alt="">` });
    const host = [brief.hostname || shot.copy];
    const size = fitSize(host, 1500, 72, 36);
    items.push(textEl(`s${index}-host`, host, size, "mask", "", "big"));
    if (brief.sample !== false) items.push(textEl(`s${index}-sample`, ["Sample"], 18, "rise", "", "sample"));
    return stack(items, 28);
  }

  const size = fitSize(words, shot.layout === "stage" ? 1700 : 1640, shot.layout === "stage" ? 156 : 132, 64);
  const line = textEl(`s${index}-line`, words, size, shot.layout === "stage" ? "scale" : textMotion, shot.highlight);
  return stack([line], 0);
}

export function timeShots(shots, length) {
  const weights = shots.map((shot) => Math.min(3, Math.max(1, Number(shot.weight) || 1)));
  const sum = weights.reduce((total, weight) => total + weight, 0) || shots.length;
  let t = 0;
  return shots.map((shot, index) => {
    const last = index === shots.length - 1;
    let dur = last ? length - t : (length * weights[index]) / sum;
    dur = Math.round(dur * 100) / 100;
    if (!last && t + dur > length - 0.9) dur = Math.round((length - 0.9 - t) * 100) / 100;
    const start = Math.round(t * 100) / 100;
    if (last) {
      dur = Math.round((length - start) * 100) / 100;
      return { ...shot, start, dur, end: length };
    }
    t = Math.round((start + dur) * 100) / 100;
    return { ...shot, start, dur, end: t };
  });
}

function burstFill(ground) {
  if (ground === "ink") return "#141414";
  if (ground === "accent") return "var(--accent)";
  return "#F3F4F6";
}

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
function letters(el, local) {
  el.querySelectorAll(".ch").forEach((ch, n) => {
    const p = ease(clamp((local - n * 0.028) / 0.36));
    ch.style.transform = "translateY(" + ((1 - p) * 110).toFixed(1) + "%)";
  });
}
function rise(el, local) {
  el.querySelectorAll(".word").forEach((word, n) => {
    const p = ease(clamp((local - 0.06 - n * 0.08) / 0.42));
    word.style.opacity = String(p);
    word.style.transform = "translateY(" + ((1 - p) * 26).toFixed(1) + "px)";
  });
}
function mask(el, local) {
  const p = ease(clamp((local - 0.04) / 0.5));
  el.style.clipPath = "inset(0 " + ((1 - p) * 100).toFixed(1) + "% 0 0)";
  el.querySelectorAll(".word").forEach((word) => { word.style.opacity = "1"; });
}
function scaleIn(el, local) {
  const p = ease(clamp(local / 0.55));
  el.style.opacity = String(p);
  el.style.transform = "scale(" + (0.92 + p * 0.08).toFixed(4) + ")";
}
function stagger(el, local) {
  el.querySelectorAll("[data-i]").forEach((node) => {
    const p = ease(clamp((local - node.dataset.i * 0.1) / 0.42));
    node.style.opacity = String(p);
    node.style.transform = "translateY(" + ((1 - p) * 18).toFixed(1) + "px)";
  });
}
function bars(el, local) {
  el.querySelectorAll("[data-h]").forEach((bar, n) => {
    const p = ease(clamp((local - 0.18 - n * 0.14) / 0.55));
    bar.style.width = ((+bar.dataset.h || 0) * p).toFixed(1) + "%";
  });
}
function counts(el, local) {
  el.querySelectorAll("[data-count]").forEach((node) => {
    const p = ease(clamp((local - 0.12) / 0.9));
    node.textContent = Math.round((+node.dataset.count) * p) + (node.dataset.suffix || "");
  });
}
function typing(el, local) {
  el.querySelectorAll("[data-line]").forEach((line, n) => {
    const full = line.dataset.line || "";
    const p = ease(clamp((local - 0.16 - n * 0.28) / 0.42));
    const c = Math.round(full.length * p);
    line.textContent = full.slice(0, c);
    line.style.borderRight = c < full.length ? "3px solid currentColor" : "3px solid transparent";
  });
}
function checks(el, local) {
  el.querySelectorAll("[data-check]").forEach((path, n) => {
    const p = ease(clamp((local - 0.28 - n * 0.26) / 0.32));
    path.style.strokeDashoffset = String(40 * (1 - p));
    const mark = path.closest(".box");
    if (mark) mark.style.background = p > 0.2 ? "var(--accent)" : "transparent";
  });
}
function draw(el, local) {
  el.querySelectorAll("[data-draw]").forEach((path, n) => {
    const p = ease(clamp((local - 0.08 - n * 0.1) / 0.7));
    path.style.strokeDasharray = "900";
    path.style.strokeDashoffset = String(900 * (1 - p));
  });
}
function cursor(el, local) {
  const node = el.querySelector("[data-cursor]");
  if (!node) return;
  const p = ease(clamp((local - 0.3) / 0.75));
  node.style.opacity = local > 0.25 ? "1" : "0";
  node.style.transform = "translate(" + (64 + p * 560).toFixed(0) + "px," + (168 + p * 180).toFixed(0) + "px)";
}
function ticker(el, local, dur) {
  const node = el.querySelector("[data-ticker]");
  if (!node) return;
  const p = clamp(local / Math.max(dur, 0.4));
  node.style.transform = "translateX(" + (-p * 35).toFixed(2) + "%)";
}
function act(el, local, dur) {
  const motion = el.dataset.motion || "";
  if (motion === "letters") letters(el, local);
  else if (motion === "rise") rise(el, local);
  else if (motion === "mask") mask(el, local);
  else if (motion === "scale") scaleIn(el, local);
  else if (motion === "stagger") stagger(el, local);
  bars(el, local);
  counts(el, local);
  typing(el, local);
  checks(el, local);
  draw(el, local);
  cursor(el, local);
  ticker(el, local, dur);
}
function render(t) {
  let ground = "paper";
  document.querySelectorAll(".scene").forEach((scene) => {
    const a = +scene.dataset.start;
    const b = +scene.dataset.end;
    const on = t >= a && t < b;
    scene.style.visibility = on ? "visible" : "hidden";
    if (!on) return;
    ground = scene.dataset.ground || "paper";
    const local = t - a;
    const dur = Math.max(0.2, b - a);
    let x = 0;
    let sc = 1;
    let blur = 0;
    if (scene.dataset.camera === "push") sc = 1 + ease(clamp(local / dur)) * 0.055;
    if (scene.dataset.camera === "pan") x = 26 - ease(clamp(local / dur)) * 52;
    if (scene.dataset.camera === "hold") x = Math.sin(local * 0.7) * 6;
    if (scene.dataset.enter === "whip" && local < 0.34) {
      const p = ease(local / 0.34);
      x += (1 - p) * 240;
      blur = (1 - p) * 7;
    }
    if (scene.dataset.enter === "push" && local < 0.4) sc *= 0.93 + 0.07 * ease(local / 0.4);
    if (scene.dataset.enter === "mask") {
      const p = ease(clamp(local / 0.42));
      scene.style.clipPath = "inset(0 " + ((1 - p) * 100).toFixed(1) + "% 0 0)";
    } else scene.style.clipPath = "none";
    const cam = scene.querySelector(".cam");
    cam.style.transform = "translateX(" + x.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
    cam.style.filter = blur > 0.35 ? "blur(" + blur.toFixed(1) + "px)" : "none";
    scene.querySelectorAll(".el").forEach((el) => act(el, local, dur));
    const burst = scene.querySelector(".burst");
    if (burst && scene.dataset.exit === "scale") {
      const u = ease(clamp((local - (dur - 0.42)) / 0.42));
      burst.style.opacity = u > 0 ? "1" : "0";
      burst.style.transform = "scale(" + (0.15 + u * 22).toFixed(3) + ")";
    }
  });
  document.body.dataset.ground = ground;
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
  const style = `left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px${el.size ? `;font-size:${el.size}px` : ""}`;
  return `<div class="el ${el.className || ""}" data-motion="${esc(el.motion || "")}" data-id="${esc(el.id)}" style="${style}">${el.html || ""}</div>`;
}

function cuesFor(shot) {
  const cues = [{ t: shot.start, sfx: shot.sfx || "tick", align: "peak" }];
  const inner = { meter: "tick", counter: "ui", checklist: "click", dashboard: "click", search: "tick", grid: "tick", split: "ui" };
  if (inner[shot.layout] && shot.dur > 1.5 && shot.layout !== "end") {
    const t = Math.round((shot.start + Math.min(shot.dur * 0.42, shot.dur - 0.05)) * 100) / 100;
    if (t > shot.start && t < shot.end) cues.push({ t, sfx: inner[shot.layout], align: "peak" });
  }
  return cues;
}

export function renderDirection(brief, direction, opts = {}) {
  const accent = /^#[0-9A-Fa-f]{6}$/.test(brief.accent || "") ? brief.accent.toUpperCase() : "#2E4BDB";
  const timed = timeShots(direction.shots, brief.length);
  for (let i = 0; i < timed.length - 1; i++) {
    if (timed[i + 1].enter === "scale") {
      timed[i].exit = "scale";
      timed[i].exitGround = timed[i + 1].ground;
    }
  }
  const seed = String(opts.seed || brief.name || "0");
  const shots = timed.map((shot, index) => {
    const elements = layoutOf(shot, brief, index, seed);
    assertClear(elements);
    return { ...shot, elements };
  });
  const events = shots.flatMap(cuesFor);
  const safeFont = String(opts.fontUrl || "/fonts/Geist-Variable.woff2").replace(/["'()\\\s]/g, "");
  const body = shots
    .map((shot) => {
      const burst = shot.exit === "scale" ? `<div class="burst" style="background:${burstFill(shot.exitGround)}"></div>` : "";
      return `<section class="scene" data-layout="${esc(shot.layout)}" data-start="${shot.start}" data-end="${shot.end}" data-ground="${shot.ground}" data-camera="${shot.camera}" data-enter="${shot.enter}" data-exit="${shot.exit || ""}"><div class="cam">${shot.elements.map(elHtml).join("")}${burst}</div></section>`;
    })
    .join("");
  const state = JSON.stringify({ end: brief.length, logo: brief.logo || "" }).replace(/</g, "\\u003c");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:G;src:url("${safeFont}") format("woff2");font-weight:100 900;font-display:swap}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:#F3F4F6;color:#141414;font-family:G,sans-serif;-webkit-font-smoothing:antialiased}
body{--accent:${accent};--on:${onAccent(accent)};--ink:#141414;--paper:#F3F4F6}
.grid{position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(20,20,20,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.05) 1px,transparent 1px);background-size:96px 96px}
body[data-ground="ink"] .grid{background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)}
body[data-ground="accent"] .grid{opacity:0}
.scene{position:absolute;inset:0;visibility:hidden;overflow:hidden;background:var(--paper);color:var(--ink)}
.scene[data-ground="ink"]{background:#141414;color:#F3F4F6}
.scene[data-ground="accent"]{background:var(--accent);color:var(--on)}
.cam{position:absolute;inset:0;transform-origin:50% 50%}
.el{position:absolute}
.big{font-weight:600;letter-spacing:-.055em;line-height:.92;text-align:center;white-space:nowrap}
.kicker{font-weight:500;letter-spacing:.18em;text-transform:uppercase;text-align:center}
.subline,.sample{font-weight:500;letter-spacing:-.02em;text-align:center}
.sample{letter-spacing:.16em;text-transform:uppercase;opacity:.78}
.word{display:inline-block}
.hi{color:var(--accent)}
.scene[data-ground="accent"] .hi{color:var(--accent);background:var(--on);border-radius:10px;padding:0 .08em}
.chm{display:inline-block;overflow:hidden;height:1.08em;vertical-align:bottom;line-height:1}
.ch{display:inline-block;transform:translateY(110%)}
.el[data-motion="rise"] .word,.el[data-motion="scale"]{opacity:0}
.el[data-motion="stagger"] [data-i]{opacity:0}
.el[data-motion="mask"]{clip-path:inset(0 100% 0 0)}
.win{width:100%;height:100%;background:#fff;color:#141414;border-radius:22px;box-shadow:0 28px 70px rgba(20,20,20,.12);overflow:hidden;position:relative;display:flex;flex-direction:column}
.chrome{height:64px;display:flex;align-items:center;gap:8px;padding:0 22px;border-bottom:1px solid #ECECEC;flex:none}
.chrome i{width:10px;height:10px;border-radius:99px;display:block;background:#E4E4E4}
.chrome i:nth-child(1){background:#FF5F57}.chrome i:nth-child(2){background:#FEBC2E}.chrome i:nth-child(3){background:#28C840}
.chrome b{margin-left:12px;font:500 18px/1 G,sans-serif;letter-spacing:-.02em}
.lines{flex:1;display:flex;flex-direction:column;justify-content:center;gap:26px;padding:12px 48px 28px;font:500 36px/1.15 G,sans-serif;letter-spacing:-.03em}
.lines div{min-height:1.15em}
.body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:26px;padding:12px 44px 36px}
.lane{display:flex;align-items:center;gap:18px;font:500 28px/1.15 G,sans-serif;letter-spacing:-.03em}
.lab{width:300px;flex:none}
.track{flex:1;height:12px;border-radius:99px;background:#ECECEC;overflow:hidden;display:block}
.track b{display:block;height:100%;width:0;background:#141414;border-radius:99px}
.track b[data-hot]{background:var(--accent)}
.sq{width:14px;height:14px;border-radius:4px;background:var(--accent);display:block;flex:none}
.lane:nth-child(odd) .sq{background:transparent;border:2px solid #141414}
.meter{background:#fff;color:#141414;border-radius:24px;box-shadow:0 28px 70px rgba(20,20,20,.1)}
.meterIn{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;gap:32px;padding:48px 56px}
.list{justify-content:center;gap:28px;padding:48px 56px}
.check{display:flex;align-items:center;gap:22px;font:500 36px/1.1 G,sans-serif;letter-spacing:-.03em}
.box{width:42px;height:42px;border:2px solid currentColor;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:none}
.box svg{width:24px;height:24px}
[data-check]{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-dasharray:40;stroke-dashoffset:40}
.field{margin:36px 40px 12px;border:2px solid #141414;border-radius:16px;min-height:84px;padding:22px 24px;font:500 34px/1 G,sans-serif;letter-spacing:-.03em}
.hits{display:flex;flex-direction:column;gap:16px;padding:12px 44px 32px}
.hit{font:500 30px/1.2 G,sans-serif;letter-spacing:-.03em;padding-top:12px;border-top:2px solid #ECECEC}
.tiles{width:100%;height:100%;display:grid;grid-template-columns:repeat(4,168px);grid-template-rows:repeat(3,168px);gap:18px}
.tile{border:2px solid #141414;border-radius:18px;display:flex;align-items:center;justify-content:center;font:600 22px/1.05 G,sans-serif;letter-spacing:-.04em;text-align:center;padding:8px}
.tile.fill{background:var(--accent);border-color:var(--accent)}
.tile.ink{background:#141414;border-color:#141414}
.scene[data-ground="ink"] .tile{border-color:#F3F4F6;color:#141414}
.scene[data-ground="ink"] .tile.ink{background:#F3F4F6}
.tile.word{background:#fff;color:#141414}
.flow{width:100%;height:100%}
.flow line,.flow circle{fill:none;stroke:currentColor;stroke-width:3}
.flow .hub{fill:var(--accent);stroke:none}
.flow text{fill:currentColor;font:500 22px/1 G,sans-serif;letter-spacing:-.03em}
.flow .hubt{fill:var(--on);font:600 32px/1 G,sans-serif}
.band{overflow:hidden;display:flex;align-items:center;border-top:2px solid currentColor;border-bottom:2px solid currentColor;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.marquee{white-space:nowrap;font:500 36px/1 G,sans-serif;letter-spacing:-.03em;padding-left:24px}
.figure{font-weight:600;letter-spacing:-.06em;line-height:.9;text-align:center}
.cursor{position:absolute;left:0;top:0;width:22px;height:28px;z-index:4;opacity:0;background:#141414;clip-path:polygon(0 0,100% 68%,62% 68%,78% 100%,48% 78%,34% 68%,0 68%)}
.logobox{display:flex;align-items:center;justify-content:center}
img.logo{width:100%;height:100%;object-fit:contain}
.burst{position:absolute;left:900px;top:480px;width:120px;height:120px;border-radius:28px;opacity:0;z-index:6}
</style></head><body data-ground="paper" data-director="1">
<div class="grid"></div>
${body}
<script id="state" type="application/json">${state}</script>
<script>${RUNTIME}</script>
</body></html>`;
  return {
    html,
    duration: brief.length,
    events,
    hostname: brief.hostname,
    template: brief.goal,
    goal: brief.goal,
    length: brief.length,
    accent,
    layouts: shots.map((shot) => shot.layout),
  };
}
