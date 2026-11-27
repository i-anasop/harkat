import { esc, clipWords } from "./copy.js";
import { assertClear } from "./layout.js";
import { icon, iconAt, iconSet } from "./icons.js";
import { resolveStyle } from "./style.js";
import { hash } from "./plan.js";

export function onAccent(hex) {
  const n = Number.parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(n)) return "#FFFFFF";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.62 ? "#141414" : "#F6F4EF";
}

export function frameOf(opts = {}) {
  if (opts.frame === "portrait") return { w: 1080, h: 1920, portrait: true };
  return { w: 1920, h: 1080, portrait: false };
}

function linesOf(shot, brief, n = 4, index = 0) {
  const pool = [];
  const push = (text) => {
    const bits = clipWords(text, 6);
    const line = bits.join(" ");
    if (line && !pool.includes(line)) pool.push(line);
  };
  (shot.rows || []).forEach(push);
  (brief.features || []).forEach(push);
  push(brief.problem);
  push(shot.copy);
  if (!pool.length) pool.push(shot.copy || brief.name);
  const start = index % pool.length;
  const spun = pool.slice(start).concat(pool.slice(0, start));
  const out = [];
  for (const line of spun) {
    if (line === shot.copy && out.length) continue;
    out.push(line);
    if (out.length === n) break;
  }
  return out.length ? out : [shot.copy];
}

function typeSize(text, portrait, start) {
  const n = Math.max(1, String(text).length);
  let size = start || (portrait ? 156 : 248);
  const max = portrait ? 960 : 1700;
  const min = portrait ? 72 : 84;
  while (size > min && n * size * 0.52 > max) size -= 6;
  return size;
}

function letters(text, cls = "") {
  return [...text].map((ch, i) => {
    if (ch === " ") return `<span class="sp"></span>`;
    return `<span class="ch" data-ch="${i}" style="--i:${i}">${esc(ch)}</span>`;
  }).join("") + (cls ? "" : "");
}

function wordsHtml(text, highlight) {
  return text.split(" ").filter(Boolean).map((word, i) => {
    const hi = highlight && word.toLowerCase() === String(highlight).toLowerCase();
    return `<span class="wd${hi ? " hi" : ""}" data-i="${i}">${letters(word)}</span>`;
  }).join(`<span class="sp"></span>`);
}

function kindOf(layout) {
  return layout || "sweep";
}

function wordList(rows, copy) {
  const words = [];
  for (const row of [copy, ...(rows || [])]) {
    for (const word of String(row || "").split(" ")) {
      if (word && !words.includes(word)) words.push(word);
    }
  }
  return words.slice(0, 6);
}

function typeExtras(copy, rows) {
  const words = wordList(rows, copy);
  const bits = (rows || []).filter((row) => row && row !== copy).slice(0, 4);
  const build = bits.map((row, i) => `<span data-i="${i}">${esc(row)}</span>`).join("");
  return `<div class="punch" data-slam data-words="${esc(words.join("|"))}">${esc(words[0] || copy)}</div><div class="build">${build}</div><i class="cutbar" data-cutbar></i>`;
}

function panel(i, x, y, w, h, inner, extra = "") {
  return `<article class="panel ${extra}" data-layer="${i}" data-focus="${i}" style="--x:${x}%;--y:${y}%;--w:${w}%;--h:${h}%">${inner}<i class="hot" data-hot="${i}" data-x="${(x + w * 0.55).toFixed(1)}" data-y="${(y + h * 0.42).toFixed(1)}"></i></article>`;
}

function stage(kind, panels, paths) {
  const links = (paths || []).map((d, i) => `<path data-link="${i}" d="${d}"/>`).join("");
  return `<div class="fill stage" data-kind="${kind}">${panels.join("")}<svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none">${links}</svg><div class="cursor" data-cursor></div><i class="cutbar" data-cutbar></i></div>`;
}

function sceneHtml(shot, brief, frame, index = 0) {
  const layout = kindOf(shot.layout);
  const rows = linesOf(shot, brief, 4, index);
  const name = clipWords(brief.name, 2).join(" ") || brief.name;
  const copy = shot.copy;
  const hi = shot.highlight || "";
  const portrait = frame.portrait;
  const size = typeSize(copy, portrait);
  if (layout === "scatter" || layout === "sweep") {
    return `<div class="fill typefill" data-kind="${layout}"><div class="big" style="font-size:${size}px">${wordsHtml(copy, hi)}</div><div class="sweepbar" data-sweep></div>${typeExtras(copy, rows)}</div>`;
  }
  if (layout === "wipe") {
    return `<div class="fill typefill" data-kind="wipe"><i class="block b1" data-block="0"></i><i class="block b2" data-block="1"></i><i class="block b3" data-block="2"></i><div class="big" style="font-size:${size}px">${wordsHtml(copy, hi)}</div>${typeExtras(copy, rows)}</div>`;
  }
  if (layout === "swap") {
    const stem = copy.split(" ").slice(0, -1).join(" ");
    const cycle = rows.map((row) => row.split(" ").at(-1) || row).filter((word, i, all) => all.indexOf(word) === i);
    const slot = cycle[0] || copy;
    return `<div class="fill typefill" data-kind="swap"><div class="big swapline" style="font-size:${Math.min(size, portrait ? 112 : 150)}px"><span>${esc(stem)}</span> <span class="slot"><span data-slot data-words="${esc(cycle.join("|"))}">${esc(slot)}</span></span></div>${typeExtras(copy, rows)}</div>`;
  }
  if (layout === "stack") {
    const reps = rows.length > 1 ? rows : [copy, copy, copy, copy];
    return `<div class="fill stackfill" data-kind="stack">${reps.map((row, i) => `<div class="rep" data-rep="${i}" style="font-size:${portrait ? 92 : 120}px">${esc(row)}</div>`).join("")}<i class="cutbar" data-cutbar></i></div>`;
  }
  if (layout === "sentence") {
    const bits = copy.split(" ").filter(Boolean);
    const lead = bits.slice(0, -1).join(" ") || bits[0] || copy;
    return `<div class="fill typefill" data-kind="sentence"><div class="big sent" style="font-size:${Math.min(size, portrait ? 96 : 132)}px"><span>${esc(lead)}</span><span class="inicons">${iconSet(4, portrait ? 54 : 72)}</span></div>${typeExtras(copy, rows)}</div>`;
  }
  if (layout === "dashboard") return dashboardHtml(name, rows, brief);
  if (layout === "code") return codeHtml(name, rows);
  if (layout === "chat") return chatHtml(name, copy, rows);
  if (layout === "notify") return notifyHtml(name, rows);
  if (layout === "kanban") return kanbanHtml(name, rows);
  if (layout === "toggles") return togglesHtml(name, rows);
  if (layout === "search") return searchHtml(name, copy, rows);
  if (layout === "orbit") return orbitHtml(name, brief);
  if (layout === "cycler") return cyclerHtml(copy, rows, portrait);
  if (layout === "metric") return metricHtml(copy, rows);
  if (layout === "compare") return compareHtml(brief, copy, rows);
  if (layout === "logo") return logoHtml(name, brief);
  return endHtml(brief);
}

function dashboardHtml(name, rows) {
  const bars = [42, 68, 54, 86, 48, 74, 92];
  const chart = `<header class="ph"><b>${esc(name)}</b><span>${esc(rows[0] || name)}</span></header><div class="chart tall">${bars.map((h, i) => `<i data-bar="${h}" data-i="${i}"${i === bars.length - 1 ? " data-hot=\"1\"" : ""}></i>`).join("")}</div>`;
  const list = `<header class="ph">${icon("dashboard", 22)}<span>${esc(rows[1] || name)}</span></header><div class="feed">${rows.map((row, i) => `<div class="feedrow" data-i="${i}">${iconAt(i, 22)}<span>${esc(row)}</span></div>`).join("")}</div>`;
  const call = `<small>${esc(name)}</small><b data-slam data-words="${esc(rows.join("|"))}">${esc(rows[0] || name)}</b><em data-tick="86"></em>`;
  return stage("dashboard", [
    panel(0, 3, 7, 62, 80, chart, "crop"),
    panel(1, 40, 12, 54, 52, list),
    panel(2, 46, 60, 48, 32, call, "callout"),
  ], ["M 36 58 C 46 58, 52 74, 64 76", "M 58 40 C 66 48, 64 62, 66 70"]);
}

function codeHtml(name, rows) {
  const editor = `<div class="tabs"><span class="on">${esc(name)}</span><span>${esc(rows[0] || name)}</span></div><div class="codebody">${rows.map((row, i) => {
    const [first, ...rest] = row.split(" ");
    return `<div class="codeline" data-i="${i}"><em>${i + 1}</em><span class="src" data-clip="${i}"><b>${esc(first || "")}</b> ${esc(rest.join(" "))}</span></div>`;
  }).join("")}</div>`;
  const files = `<header class="ph">${icon("file", 20)}<span>${esc(name)}</span></header>${rows.map((row, i) => `<div class="fileline ${i === 0 ? "on" : ""}" data-i="${i}">${icon("file", 18)}<span>${esc(row)}</span></div>`).join("")}`;
  const diff = `<header class="ph"><b>${esc(rows[0] || name)}</b></header><div class="diffline add">${esc(rows[1] || name)}</div><div class="diffline del">${esc(rows[2] || rows[0] || name)}</div>`;
  return stage("code", [
    panel(0, 3, 6, 66, 86, editor, "crop darkpanel"),
    panel(1, 50, 8, 44, 44, files),
    panel(2, 42, 54, 52, 38, diff, "callout"),
  ], ["M 40 70 C 48 70, 50 78, 58 82", "M 64 48 C 62 56, 58 62, 56 68"]);
}

function chatHtml(name, copy, rows) {
  const thread = `<header class="ph"><b>${esc(name)}</b></header><div class="bubble them">${esc(rows[1] || copy)}</div><div class="bubble me"><span data-stream="${esc(copy)}"></span></div>`;
  const list = `<header class="ph">${icon("chat", 22)}<span>${esc(rows[0] || name)}</span></header>${rows.map((row, i) => `<div class="fileline ${i === 0 ? "on" : ""}" data-i="${i}">${iconAt(i, 18)}<span>${esc(row)}</span></div>`).join("")}`;
  const composer = `${icon("arrow", 28)}<b data-slam data-words="${esc(wordList(rows, copy).join("|"))}">${esc(copy)}</b>`;
  return stage("chat", [
    panel(0, 3, 7, 60, 82, thread, "crop"),
    panel(1, 46, 8, 48, 46, list),
    panel(2, 34, 60, 60, 32, composer, "callout"),
  ], ["M 34 68 C 42 68, 46 76, 54 78"]);
}

function notifyHtml(name, rows) {
  const notes = rows.slice(0, 3).map((row, i) => panel(i, 8 + i * 6, 8 + i * 14, 50, 30, `<div class="badge">${iconAt(i, 28)}</div><div><small>${esc(name)}</small><b>${esc(row)}</b></div>`));
  notes.push(panel(3, 54, 60, 36, 26, `<small>${esc(name)}</small><b data-slam data-words="${esc(rows.join("|"))}">${esc(rows[0] || name)}</b>`, "callout"));
  return stage("notify", notes, ["M 32 36 C 42 44, 50 56, 60 66"]);
}

function kanbanHtml(name, rows) {
  const cols = rows.slice(0, 3);
  const cards = cols.map((col, i) => panel(i, 3 + i * 20, i === 1 ? 6 : 16, 34, 62, `<header class="ph">${esc(col.split(" ")[0])}</header><div class="kcard ${i === 1 ? "lift" : ""}">${iconAt(i, 22)}<span>${esc(col)}</span></div><div class="kcard ghost">${esc(rows[(i + 1) % rows.length] || col)}</div>`));
  cards.push(panel(3, 52, 60, 42, 30, `<small>${esc(name)}</small><b data-slam data-words="${esc(rows.join("|"))}">${esc(cols[0] || name)}</b>`, "callout"));
  return stage("kanban", cards, ["M 28 40 C 40 48, 48 64, 62 72"]);
}

function togglesHtml(name, rows) {
  const list = `<header class="ph"><b>${esc(name)}</b>${icon("settings", 22)}</header><div class="tlist">${rows.map((row, i) => `<div class="trow" data-i="${i}"><span>${esc(row)}</span><i class="switch" data-knob="${i}"><i></i></i></div>`).join("")}</div>`;
  const preview = `<small>${esc(name)}</small><b data-slam data-words="${esc(rows.join("|"))}">${esc(rows[0] || name)}</b><em data-tick="${rows.length * 24}"></em>`;
  return stage("toggles", [
    panel(0, 4, 8, 58, 82, list, "crop"),
    panel(1, 46, 10, 46, 36, preview, "callout"),
    panel(2, 50, 48, 44, 42, `<header class="ph">${esc(rows[1] || name)}</header>${iconSet(4, 36)}`, ""),
  ], ["M 40 28 C 50 28, 54 36, 60 40", "M 46 70 C 54 64, 58 58, 64 56"]);
}

function searchHtml(name, copy, rows) {
  const hits = rows.filter((row) => row !== copy).slice(0, 4);
  const list = hits.length ? hits : rows;
  const field = `<div class="field bigfield">${icon("search", 36)}<span data-line="${esc(copy)}"></span></div>`;
  const results = list.map((row, i) => `<div class="result${i === 0 ? " on" : ""}" data-i="${i}">${iconAt(i, 26)}<span>${esc(row)}</span>${icon("arrow", 22)}</div>`).join("");
  const detail = `<div class="detailkicker">${esc(name)}</div><div class="detailbig" data-slam data-words="${esc(list.join("|"))}">${esc(list[0] || copy)}</div>${icon("search", 64)}`;
  return stage("search", [
    panel(0, 4, 4, 92, 26, field),
    panel(1, 3, 22, 54, 72, results),
    panel(2, 44, 28, 50, 62, detail, "darkpanel"),
  ], ["M 28 34 C 38 40, 46 48, 56 52"]);
}

function orbitHtml(name, brief) {
  const marks = [0, 1, 2, 3, 4, 5];
  return `<div class="fill orbitwrap" data-kind="orbit"><div class="hub" data-mark>${brief.logo ? `<img class="logo" alt="">` : `<b data-slam data-words="${esc(name)}">${esc(name)}</b>`}</div>${marks.map((i) => `<i class="orb" data-orb="${i}">${iconAt(i, 32)}</i>`).join("")}<i class="cutbar" data-cutbar></i></div>`;
}

function cyclerHtml(copy, rows, portrait) {
  return `<div class="fill cycler" data-kind="cycler"><div class="hero" style="font-size:${portrait ? 84 : 104}px">${esc(copy)}</div><div class="menu"><i class="arrow" data-arrow>${icon("arrow", 36)}</i>${rows.map((row, i) => `<div class="mitem" data-row="${i}">${esc(row)}</div>`).join("")}</div><i class="cutbar" data-cutbar></i></div>`;
}

function metricHtml(copy, rows) {
  const found = copy.match(/\d+(?:\.\d+)?/);
  const num = found ? found[0] : "";
  const suffix = copy.includes("%") ? "%" : "";
  const before = copy.slice(0, copy.search(/\d/)).trim();
  const bars = [36, 52, 44, 70, 58, 86, 64, 96];
  const words = wordList(rows, before || copy);
  return `<div class="fill metric" data-kind="metric"><div class="mleft">${before ? `<small data-slam data-words="${esc(words.join("|"))}">${esc(before)}</small>` : ""}<div class="num" data-count="${esc(num)}" data-suffix="${esc(suffix)}">0${esc(suffix)}</div></div><div class="mchart">${bars.map((h, i) => `<i data-bar="${h}" data-i="${i}"${i === bars.length - 1 ? " data-hot=\"1\"" : ""}></i>`).join("")}</div><i class="cutbar" data-cutbar></i></div>`;
}

function compareHtml(brief, copy, rows) {
  const left = clipWords(brief.problem, 4).join(" ") || copy;
  const right = rows.find((row) => row !== left) || copy;
  const card = panel(0, 36, 62, 28, 24, `<small>${esc(copy)}</small><b data-slam data-words="${esc(wordList(rows, copy).join("|"))}">${esc(right)}</b>`, "callout");
  return `<div class="fill halves" data-kind="compare"><div class="half ink"><div class="big halfbig">${esc(left)}</div></div><div class="half paper"><div class="big halfbig">${esc(right)}</div></div><i class="seam" data-seam></i>${card}<i class="cutbar" data-cutbar></i></div>`;
}

function logoHtml(name, brief) {
  const dots = Array.from({ length: 18 }, (_, i) => `<i class="dot" data-dot="${i}"></i>`).join("");
  const mark = brief.logo ? `<img class="logo biglogo" alt="" data-mark>` : `<b class="wordmark" data-mark>${esc(name)}</b>`;
  return `<div class="fill logowrap" data-kind="logo">${dots}<div class="mark">${mark}</div><i class="cutbar" data-cutbar></i></div>`;
}

function endHtml(brief) {
  const host = brief.hostname;
  const sample = brief.sample !== false ? `<div class="sample">Sample</div>` : "";
  const logo = brief.logo ? `<img class="logo biglogo" alt="">` : "";
  return `<div class="fill endwrap" data-kind="end">${logo}<div class="host" data-mark>${esc(host)}</div>${sample}<i class="cutbar" data-cutbar></i></div>`;
}

function spinShots(shots, seed) {
  if (!Array.isArray(shots) || shots.length < 4) return shots;
  const head = shots[0];
  const tail = shots[shots.length - 1];
  const mid = shots.slice(1, -1);
  const shift = hash(String(seed)) % mid.length;
  return [head, ...mid.slice(shift), ...mid.slice(0, shift), tail];
}

/** Split a hold into 0.6–1.1s pieces. Layout names stay on the source shots. */
export function cutShots(shots, rhythm = "tight") {
  const limit = rhythm === "measured" ? 1.15 : 1.02;
  const out = [];
  for (const shot of shots) {
    const pieces = shot.dur > limit + 0.2 ? Math.min(4, Math.max(2, Math.round(shot.dur / 0.8))) : 1;
    if (pieces === 1) {
      out.push({ ...shot, phase: 0 });
      continue;
    }
    const piece = shot.dur / pieces;
    for (let p = 0; p < pieces; p++) {
      const start = p === 0 ? shot.start : Math.round((shot.start + piece * p) * 100) / 100;
      const end = p === pieces - 1 ? shot.end : Math.round((shot.start + piece * (p + 1)) * 100) / 100;
      out.push({
        ...shot,
        phase: p % 4,
        start,
        end,
        dur: Math.round((end - start) * 100) / 100,
        enter: p === 0 ? shot.enter : "cut",
      });
    }
  }
  return out;
}

export function timeShots(shots, length) {
  const weights = shots.map((shot) => Math.min(3, Math.max(1, Number(shot.weight) || 1)));
  const sum = weights.reduce((total, weight) => total + weight, 0) || shots.length;
  let t = 0;
  return shots.map((shot, index) => {
    const last = index === shots.length - 1;
    let dur = last ? length - t : (length * weights[index]) / sum;
    dur = Math.round(dur * 100) / 100;
    if (!last && t + dur > length - 1.2) dur = Math.round(Math.max(1.2, length - 1.2 - t) * 100) / 100;
    const start = Math.round(t * 100) / 100;
    if (last) {
      dur = Math.round((length - start) * 100) / 100;
      return { ...shot, start, dur, end: length };
    }
    t = Math.round((start + dur) * 100) / 100;
    return { ...shot, start, dur, end: t };
  });
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
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const x = 3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid;
    if (x < t) lo = mid; else hi = mid;
  }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
}
function spring(t) {
  const p = clamp(t);
  if (STATE.ease === "glide") return ease(p);
  const k = STATE.ease === "snap" ? 9.5 : 5.2;
  const w = STATE.ease === "snap" ? 13 : 7.2;
  return 1 - Math.exp(-k * p) * Math.cos(w * p);
}
function phaseOf(local, base) {
  return (base || 0) + (STATE.shift || 0) + Math.floor(Math.max(0, local) / (STATE.step || 0.48));
}
function scatter(root, local) {
  root.querySelectorAll("[data-ch]").forEach((ch) => {
    const i = +ch.dataset.ch;
    const p = spring(clamp((local - i * 0.018) / 0.5));
    const ang = i * 0.9;
    const dist = (1 - Math.min(1, Math.max(0, p))) * (STATE.portrait ? 280 : 460);
    const bob = Math.sin(local * 1.7 + i * 0.6) * (4 + (STATE.pace === "snap" ? 3 : 0));
    const x = Math.cos(ang) * dist;
    const y = Math.sin(ang * 1.17) * dist * 0.55 + bob;
    ch.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    const blur = Math.max(0, (1 - p) * 7);
    ch.style.filter = blur > 0.4 ? "blur(" + blur.toFixed(1) + "px)" : "none";
    ch.style.opacity = String(Math.min(1, 0.15 + p));
  });
  const bar = root.querySelector("[data-sweep]");
  if (bar) {
    const p = ease(clamp((local - 0.25) / 0.45));
    bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
  }
}
function wipe(root, local) {
  root.querySelectorAll("[data-block]").forEach((block) => {
    const i = +block.dataset.block;
    const p = ease(clamp((local - i * 0.08) / 0.42));
    block.style.transform = "translateX(" + ((1 - p) * 110).toFixed(1) + "%)";
  });
  scatter(root, local);
}
function swap(root, local) {
  const slot = root.querySelector("[data-slot]");
  if (!slot) return;
  const words = (slot.dataset.words || "").split("|").filter(Boolean);
  if (!words.length) return;
    const step = STATE.step || (STATE.pace === "slow" ? 0.62 : 0.42);
  const index = Math.floor(Math.max(0, local) / step) % words.length;
  const u = ease(clamp((local % step) / 0.28));
  slot.textContent = words[index];
  slot.style.transform = "translateY(" + ((1 - u) * 36).toFixed(1) + "px)";
  slot.style.opacity = String(u);
}
function stack(root, local) {
  const reps = [...root.querySelectorAll("[data-rep]")];
  if (!reps.length) return;
  const active = Math.floor(Math.max(0, local) / (STATE.step || 0.42)) % reps.length;
  reps.forEach((rep, i) => {
    const on = i === active;
    rep.style.opacity = on ? "1" : "0.16";
    rep.style.transform = "scale(" + (on ? 1 : 0.97) + ")";
  });
}
function bars(root, local) {
  root.querySelectorAll("[data-bar]").forEach((bar, n) => {
    const p = ease(clamp((local - 0.12 - n * 0.05) / 0.45));
    const h = (+bar.dataset.bar || 40) * p * (1 + Math.sin(local * 1.3 + n) * 0.07);
    bar.style.height = h.toFixed(1) + "%";
    bar.style.transform = "none";
  });
}
function typing(root, local, attr) {
  root.querySelectorAll("[" + attr + "]").forEach((line, n) => {
    const full = line.dataset[attr === "data-line" ? "line" : "stream"] || line.getAttribute(attr) || "";
    const p = ease(clamp((local - 0.12 - n * 0.22) / 0.55));
    const c = Math.round(full.length * p);
    line.textContent = full.slice(0, c);
    line.style.borderRight = c < full.length ? "3px solid currentColor" : "3px solid transparent";
  });
}
function notes(root, local) {
  root.querySelectorAll("[data-note]").forEach((note) => {
    const i = +note.dataset.note;
    const p = spring(clamp((local - i * 0.12) / 0.45));
    const y = (1 - Math.min(1, p)) * 80 + i * 28;
    note.style.transform = "translateY(" + y.toFixed(1) + "px) scale(" + (1 - i * 0.04).toFixed(3) + ")";
    note.style.opacity = String(Math.min(1, p));
    note.style.filter = i ? "blur(" + (i * 0.6).toFixed(1) + "px)" : "none";
  });
}
function knobs(root, local) {
  root.querySelectorAll("[data-knob]").forEach((knob) => {
    const i = +knob.dataset.knob;
    const p = ease(clamp((local - 0.2 - i * 0.22) / 0.28));
    const dot = knob.firstElementChild;
    if (dot) dot.style.transform = "translateX(" + (p * 36).toFixed(1) + "px)";
    knob.classList.toggle("on", p > 0.55);
  });
}
function orbit(root, local) {
  const orbs = [...root.querySelectorAll("[data-orb]")];
  const box = root.getBoundingClientRect();
  const rx = (STATE.portrait ? 280 : 560);
  const ry = (STATE.portrait ? 420 : 250);
  orbs.forEach((orb) => {
    const i = +orb.dataset.orb;
    const a = ((i / Math.max(1, orbs.length)) * Math.PI * 2) + local * 0.35;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    orb.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
  });
  void box;
}
function cycler(root, local) {
  const rows = [...root.querySelectorAll("[data-row]")];
  if (!rows.length) return;
  const active = Math.floor(Math.max(0, local) / (STATE.step || 0.48)) % rows.length;
  rows.forEach((row, i) => row.classList.toggle("on", i === active));
  const arrow = root.querySelector("[data-arrow]");
  if (arrow) arrow.style.transform = "translateY(" + (active * 92).toFixed(0) + "px)";
}
function counts(root, local) {
  const jumped = Math.min(1, Math.floor(Math.max(0, local) / 0.08) / 5);
  root.querySelectorAll("[data-count],[data-tick]").forEach((node) => {
    const target = +(node.dataset.count || node.dataset.tick || 0);
    node.textContent = Math.round(target * jumped) + (node.dataset.suffix || "");
  });
}
function slam(root, local) {
  root.querySelectorAll("[data-slam]").forEach((node) => {
    const words = (node.dataset.words || "").split("|").filter(Boolean);
    if (words.length < 2 || node.closest(".big, .hero")) return;
    const step = STATE.step || 0.48;
    const index = Math.floor(Math.max(0, local) / step) % words.length;
    const u = spring(clamp((local % step) / 0.16));
    if (node.textContent !== words[index]) node.textContent = words[index];
    node.style.transform = "translateY(" + ((1 - Math.min(1, u)) * 22).toFixed(1) + "px)";
    node.style.opacity = "1";
  });
}
function build(root, local) {
  root.querySelectorAll(".build [data-i]").forEach((node) => {
    const i = +node.dataset.i;
    const p = spring(clamp((local - i * (STATE.step || 0.48) * 0.55) / 0.2));
    node.style.opacity = String(Math.min(1, p));
    node.style.transform = "translateX(" + ((1 - Math.min(1, p)) * -36).toFixed(1) + "px)";
  });
}
function focusPanels(root, local, phase) {
  const panels = [...root.querySelectorAll("[data-focus]")];
  if (!panels.length) return;
  const on = ((phase % panels.length) + panels.length) % panels.length;
  panels.forEach((panel) => {
    const i = +panel.dataset.focus;
    const born = spring(clamp((local - i * 0.035) / 0.1));
    const hot = i === on;
    panel.style.opacity = String(Math.min(1, 0.35 + born * 0.65));
    panel.style.zIndex = hot ? "6" : String(2 + i);
    const sc = hot ? 1.045 : 0.985;
    const dx = hot ? -6 : 10;
    const y = (1 - Math.min(1, born)) * 28 + Math.sin(local * 1.6 + i) * 4;
    panel.style.transform = "translate(" + dx.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
  });
}
function drawLinks(root, local, phase) {
  root.querySelectorAll("[data-link]").forEach((path) => {
    const i = +path.dataset.link;
    const p = phase % 3 > i ? 1 : ease(clamp((local - 0.08 - i * 0.18) / 0.28));
    path.style.strokeDashoffset = String((1 - p) * 280);
  });
}
function moveCursor(root, local, phase) {
  const cursor = root.querySelector("[data-cursor]");
  const hots = [...root.querySelectorAll("[data-hot]")];
  if (!cursor || !hots.length) return;
  const hot = hots[((phase % hots.length) + hots.length) % hots.length];
  const u = (local % (STATE.step || 0.48)) / 0.14;
  const click = u > 1 && u < 1.45 ? 0.62 : 1;
  cursor.style.left = hot.dataset.x + "%";
  cursor.style.top = hot.dataset.y + "%";
  cursor.style.transform = "scale(" + click.toFixed(2) + ")";
}
function typeCut(root, local) {
  const big = root.querySelector(".big");
  const punch = root.querySelector(".punch");
  if (!big && !punch) return;
  const step = STATE.step || 0.48;
  const mode = Math.floor(Math.max(0, local) / step) % 3;
  if (big) {
    big.style.opacity = mode === 1 ? "0" : "1";
    big.style.transform = mode === 2 ? "translateY(-6%) scale(.78)" : "none";
  }
  if (punch) {
    punch.style.opacity = mode === 0 ? "0" : "1";
    punch.style.fontSize = mode === 1 ? (STATE.portrait ? "148px" : "200px") : "64px";
    punch.style.top = mode === 1 ? "34%" : "auto";
    punch.style.bottom = mode === 1 ? "auto" : "12%";
  }
  const build = root.querySelector(".build");
  if (build) build.style.opacity = mode === 2 ? "1" : "0";
}
function cutFlash(root, local) {
  const bar = root.querySelector("[data-cutbar]");
  if (!bar) return;
  const step = STATE.step || 0.48;
  const u = (local % step) / step;
  const p = u < 0.18 ? ease(u / 0.18) : 1;
  bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
  bar.style.opacity = u < 0.45 ? "1" : String(Math.max(0, 1 - (u - 0.45) / 0.18));
}
function logo(root, local) {
  const p = spring(clamp(local / 0.7));
  root.querySelectorAll("[data-dot]").forEach((dot) => {
    const i = +dot.dataset.dot;
    const a = (i / 18) * Math.PI * 2;
    const ring = STATE.portrait ? 300 : 420;
  const dist = ring + (1 - Math.min(1, p)) * 380;
    dot.style.transform = "translate(" + (Math.cos(a) * dist).toFixed(1) + "px," + (Math.sin(a) * dist).toFixed(1) + "px)";
    dot.style.opacity = "1";
  });
  const mark = root.querySelector("[data-mark]");
  if (mark) mark.style.transform = "scale(" + (0.86 + Math.min(1, p) * 0.14).toFixed(3) + ")";
}
function seam(root, local) {
  const bar = root.querySelector("[data-seam]");
  if (!bar) return;
  const p = ease(clamp(local / 0.45));
  bar.style.transform = "scaleY(" + (0.2 + p * 0.8).toFixed(3) + ")";
}
function play(root, local, phase) {
  const kind = root.dataset.kind || "";
  if (kind === "scatter" || kind === "sweep" || kind === "sentence") scatter(root, local);
  if (kind === "wipe") wipe(root, local);
  if (kind === "swap") swap(root, local);
  if (kind === "stack") stack(root, local);
  bars(root, local);
  typing(root, local, "data-line");
  root.querySelectorAll("[data-clip]").forEach((line) => {
    const i = +line.dataset.clip;
    const p = ease(clamp(local / 0.1));
    line.style.opacity = String(Math.min(1, p));
    line.style.clipPath = "none";
  });
  typing(root, local, "data-stream");
  if (kind === "notify") notes(root, local);
  knobs(root, local);
  if (kind === "orbit") orbit(root, local);
  if (kind === "cycler") cycler(root, local);
  counts(root, local);
  slam(root, local);
  build(root, local);
  typeCut(root, local);
  focusPanels(root, local, phase);
  drawLinks(root, local, phase);
  moveCursor(root, local, phase);
  cutFlash(root, local);
  if (kind === "logo" || kind === "end") logo(root, local);
  if (kind === "compare") seam(root, local);
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
    let x = Math.sin(local * 0.65) * 8;
    let y = Math.cos(local * 0.4) * 5;
    let sc = 1.01 + local * 0.006 + Math.sin(local * 0.9) * 0.008;
    let blur = 0;
    if (scene.dataset.camera === "drift") x = Math.sin(local * 0.5) * 16;
    if (scene.dataset.camera === "parallax" || scene.dataset.camera === "pan") x = Math.sin(local * 0.35) * 22;
    if (scene.dataset.camera === "push") sc += ease(clamp(local / dur)) * 0.035;
    if (scene.dataset.enter === "whip" && local < 0.2) {
      const p = ease(local / 0.2);
      x += (1 - p) * 80;
      blur = (1 - p) * 6;
    }
    if (scene.dataset.enter === "push" && local < 0.22) sc *= 0.94 + 0.06 * ease(local / 0.22);
    if (scene.dataset.enter === "mask") {
      const p = ease(clamp(local / 0.16));
      scene.style.clipPath = "inset(0 " + ((1 - p) * 100).toFixed(1) + "% 0 0)";
    } else scene.style.clipPath = "none";
    const cam = scene.querySelector(".cam");
    cam.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
    cam.style.filter = blur > 0.35 ? "blur(" + blur.toFixed(1) + "px)" : "none";
    const back = scene.querySelector(".back");
    if (back) back.style.transform = "translate(" + (x * -0.65).toFixed(1) + "px," + (y * -0.8).toFixed(1) + "px)";
    const ribbon = scene.querySelector("[data-ribbon]");
    if (ribbon) ribbon.style.transform = "translateX(" + ((-local * 90) % 600).toFixed(1) + "px)";
    const root = scene.querySelector("[data-kind]");
    if (root) play(root, local, phaseOf(local, +scene.dataset.phase || 0));
    const burst = scene.querySelector(".burst");
    if (burst && scene.dataset.exit === "scale") {
      const u = ease(clamp((local - (dur - 0.28)) / 0.28));
      burst.style.opacity = u > 0.02 ? "1" : "0";
      burst.style.transform = "scale(" + (0.2 + u * 26).toFixed(3) + ")";
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

function burstFill(ground) {
  if (ground === "ink") return "#0C0D10";
  if (ground === "accent") return "var(--accent)";
  return "#E4E1DA";
}

export function renderDirection(brief, direction, opts = {}) {
  const frame = frameOf(opts);
  const accent = /^#[0-9A-Fa-f]{6}$/.test(brief.accent || "") ? brief.accent.toUpperCase() : "#2E4BDB";
  const style = resolveStyle(opts.seed || brief.name, direction.style);
  const ordered = timeShots(spinShots(direction.shots, opts.seed || brief.name), brief.length);
  const layouts = ordered.map((shot) => shot.layout);
  const timed = cutShots(ordered, direction.rhythm);
  for (let i = 0; i < timed.length - 1; i++) {
    if (timed[i + 1].enter === "scale") {
      timed[i].exit = "scale";
      timed[i].exitGround = timed[i + 1].ground;
    }
  }
  const history = [];
  const shots = timed.map((shot, index) => {
    const ribbon = history.length
      ? `<div class="ribbon"><span data-ribbon>${esc([...history, ...history].join("    ·    "))}</span></div>`
      : "";
    const elements = [{
      id: `s${index}`,
      x: 0,
      y: 0,
      w: frame.w,
      h: frame.h,
      html: `<div class="back"></div>${sceneHtml(shot, brief, frame, index)}${ribbon}`,
    }];
    if (shot.copy && !shot.phase) history.push(shot.copy);
    assertClear(elements);
    return { ...shot, elements };
  });
  const events = [];
  for (const shot of shots) {
    events.push({ t: shot.start, sfx: shot.sfx || "tick", align: "peak" });
    if (shot.layout !== "end" && shot.dur > 1.6) {
      const t = Math.round((shot.start + Math.min(shot.dur * 0.4, shot.dur - 0.08)) * 100) / 100;
      const inner = { code: "ui", chat: "ui", search: "tick", toggles: "click", dashboard: "tick", metric: "ui", notify: "thud", kanban: "click" };
      if (inner[shot.layout] && t > shot.start && t < shot.end) events.push({ t, sfx: inner[shot.layout], align: "peak" });
    }
  }
  const safeFont = String(opts.fontUrl || "/fonts/Geist-Variable.woff2").replace(/["'()\\\s]/g, "");
  const body = shots.map((shot) => {
    const burst = shot.exit === "scale" ? `<div class="burst" style="background:${burstFill(shot.exitGround)}"></div>` : "";
    const inner = shot.elements.map((el) => `<div class="el" data-id="${esc(el.id)}" style="left:0;top:0;width:${frame.w}px;height:${frame.h}px">${el.html}</div>`).join("");
    return `<section class="scene g-${shot.ground}" data-layout="${esc(shot.layout)}" data-phase="${shot.phase || 0}" data-start="${shot.start}" data-end="${shot.end}" data-ground="${shot.ground}" data-camera="${style.camera}" data-enter="${shot.enter}" data-exit="${shot.exit || ""}"><div class="cam">${inner}${burst}</div></section>`;
  }).join("");
  const state = JSON.stringify({
    end: brief.length,
    logo: brief.logo || "",
    portrait: frame.portrait,
    pace: style.pace,
    ease: style.ease,
    step: style.pace === "slow" ? 0.62 : style.ease === "snap" ? 0.4 : style.ease === "glide" ? 0.55 : 0.46,
    shift: hash(String(opts.seed || brief.name)) % 3,
  }).replace(/</g, "\\u003c");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:G;src:url("${safeFont}") format("woff2");font-weight:100 900;font-display:swap}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${frame.w}px;height:${frame.h}px;overflow:hidden;background:#E4E1DA;color:#141414;font-family:G,sans-serif;-webkit-font-smoothing:antialiased}
body{--accent:${accent};--on:${onAccent(accent)};--ink:#0C0D10;--paper:#E4E1DA;--card:#F7F6F3;--radius:28px}
body[data-shape="sharp"]{--radius:4px}
body[data-shape="pill"]{--radius:48px}
body[data-type="wide"] .big,body[data-type="wide"] .rep,body[data-type="wide"] .hero{letter-spacing:.02em;font-weight:500}
body[data-type="heavy"] .big,body[data-type="heavy"] .rep,body[data-type="heavy"] .num{font-weight:800;letter-spacing:-.08em}
body[data-type="light"] .big,body[data-type="light"] .rep{font-weight:400}
body[data-density="pack"] .appwrap{padding:16px}
body[data-density="air"] .appwrap{padding:72px}
body[data-colour="field"] .g-paper{background:color-mix(in srgb, var(--accent) 16%, var(--paper))}
body[data-colour="line"] .big{text-decoration:underline;text-decoration-thickness:8px;text-underline-offset:10px;text-decoration-color:var(--accent)}
body[data-face="mono"]{font-family:ui-monospace,monospace}
body[data-face="mono"] .big,body[data-face="mono"] .rep,body[data-face="mono"] .hero,body[data-face="mono"] .num,body[data-face="mono"] .host,body[data-face="mono"] .punch{font-weight:650;letter-spacing:-.045em}
body[data-face="display"] .big,body[data-face="display"] .rep,body[data-face="display"] .hero,body[data-face="display"] .num,body[data-face="display"] .wordmark,body[data-face="display"] .punch{font-weight:300;letter-spacing:-.08em}
body[data-face="display"] .panel{box-shadow:0 40px 90px rgba(0,0,0,.1)}
body[data-shape="sharp"] .panel,body[data-shape="sharp"] .note,body[data-shape="sharp"] .bubble{border-radius:0;box-shadow:none;border:2px solid #161616}
body[data-shape="pill"] .panel,body[data-shape="pill"] .bubble{border-radius:46px}
body[data-colour="field"] .stage::before{content:"";position:absolute;left:-6%;top:8%;width:48%;height:84%;background:var(--accent);border-radius:var(--radius);z-index:0}
body[data-colour="line"] .panel{border-top:12px solid var(--accent)}
body[data-density="air"] .stage{inset:28px}
body[data-density="pack"] .stage{inset:0}
body[data-type="heavy"] .punch{font-weight:800}
.stage{position:absolute;inset:0}
.panel{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);background:#fff;color:#161616;border-radius:var(--radius);box-shadow:0 28px 70px rgba(0,0,0,.22);overflow:hidden;display:flex;flex-direction:column;padding:28px 32px;z-index:2}
.panel.darkpanel{background:#14161C;color:#F4F1EA}
.panel.callout{background:var(--accent);color:var(--on);justify-content:flex-end;gap:8px}
.panel.callout small,.panel small{display:block;letter-spacing:.14em;text-transform:uppercase;font-size:16px;opacity:.7}
.panel.callout b{font-size:44px;letter-spacing:-.045em;line-height:.95}
.panel.callout em{font-style:normal;font-size:72px;letter-spacing:-.06em;line-height:.85}
.ph{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:22px;font-weight:600;letter-spacing:-.03em;margin-bottom:14px}
.fileline{display:flex;gap:10px;align-items:center;padding:12px 4px;font-size:24px;font-weight:550}
.fileline.on{color:var(--accent)}
.kcard{background:#fff;border-radius:16px;padding:16px;min-height:88px;box-shadow:0 10px 24px rgba(0,0,0,.08);display:flex;flex-direction:column;gap:10px;font-size:24px;font-weight:600;margin-bottom:12px}
.kcard.ghost{opacity:.45}
.kcard.lift{outline:3px solid var(--accent)}
.diffline{font-size:26px;padding:10px 12px;border-radius:10px;margin-top:8px}
.diffline.add{background:#12382C;color:#7DDEBA}
.diffline.del{background:#3A1818;color:#FFB4A8}
.links{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.links path{fill:none;stroke:var(--accent);stroke-width:.55;stroke-dasharray:280;stroke-dashoffset:280}
.cursor{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:99px;background:var(--accent);box-shadow:0 0 0 7px color-mix(in srgb,var(--accent) 35%,transparent);z-index:8}
.hot{display:none}
.cutbar{position:absolute;left:0;right:0;top:0;height:16px;background:var(--accent);transform:scaleX(0);transform-origin:0 50%;z-index:9;pointer-events:none}
.punch{position:absolute;left:0;right:0;bottom:12%;font-size:132px;font-weight:600;letter-spacing:-.06em;line-height:.84;color:var(--accent);text-align:center}
.build{position:absolute;left:7%;top:9%;display:flex;flex-direction:column;gap:10px;font-size:30px;font-weight:550;letter-spacing:-.03em}
.chart.tall{flex:1;min-height:220px}
.panel .codebody{font-size:28px;gap:14px;padding:20px 8px;background:transparent;color:inherit}
.panel .tabs{background:transparent;color:inherit}
.panel .src{white-space:normal}
.panel .bubble{font-size:36px;max-width:100%}
body.portrait .punch{font-size:72px}
body.portrait .panel.callout b{font-size:32px}
body[data-bg="dots"] .back{background-image:radial-gradient(rgba(20,20,20,.28) 1.5px, transparent 1.6px);background-size:22px 22px}
body[data-bg="bands"] .back{background-image:repeating-linear-gradient(-18deg, transparent, transparent 18px, rgba(20,20,20,.06) 18px, rgba(20,20,20,.06) 36px)}
body[data-bg="diagonal"] .back{background-image:repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(20,20,20,.08) 10px, rgba(20,20,20,.08) 12px)}
body[data-bg="plain"] .back{background-image:none}
.app,.editor,.board,.finder,.note,.stat,.col article{border-radius:var(--radius)}
body.portrait .cycler,body.portrait .metric,body.portrait .halves,body.portrait .app{flex-direction:column}
body.portrait .rail{width:100%;height:108px;flex-direction:row;border-right:0;border-bottom:1px solid rgba(0,0,0,.08)}
body.portrait .half{min-height:50%}
.scene{position:absolute;inset:0;visibility:hidden;overflow:hidden}
.g-paper{background:var(--paper);color:#141414}
.g-ink{background:var(--ink);color:#F4F1EA}
.g-accent{background:var(--accent);color:var(--on)}
.cam{position:absolute;inset:0;transform-origin:50% 50%}
.el{position:absolute}
.back{position:absolute;inset:-40px;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px);background-size:88px 88px}
.g-ink .back{background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)}
.g-accent .back{opacity:.25}
.fill{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.typefill{padding:72px}
.big{font-weight:600;letter-spacing:-.06em;line-height:.9;text-align:center;max-width:100%}
.wd{display:inline-block;white-space:nowrap}
.hi{color:var(--accent)}
.g-accent .hi{background:var(--on);color:var(--accent);border-radius:12px;padding:0 .08em}
.ch{display:inline-block}
.sp{display:inline-block;width:.28em}
.sweepbar{position:absolute;left:12%;right:12%;bottom:18%;height:18px;background:var(--accent);transform:scaleX(0);transform-origin:0 50%;border-radius:99px}
.g-accent .sweepbar{background:var(--on)}
.block{position:absolute;top:0;bottom:0;width:34%;background:rgba(0,0,0,.18)}
.b1{left:0}.b2{left:33%}.b3{left:66%}
.slot{display:inline-block;background:var(--accent);color:#fff;border-radius:16px;padding:0 .16em;min-width:1.2em}
.g-accent .slot{background:var(--on);color:var(--accent)}
.stackfill{flex-direction:column;gap:8px;align-items:stretch;padding:64px 80px}
.rep{font-weight:600;letter-spacing:-.06em;line-height:.92;text-align:center}
.inicons{display:inline-flex;gap:14px;margin-left:.35em;vertical-align:middle}
.inicons .ico{background:var(--accent);color:#fff;border-radius:18px;padding:10px;width:auto;height:auto}
.appwrap{padding:44px}
.app,.editor,.board,.finder{width:100%;height:100%;display:flex;background:var(--card);color:#161616;border-radius:28px;box-shadow:0 40px 90px rgba(0,0,0,.28);overflow:hidden}
.g-ink .app,.g-ink .editor,.g-ink .board,.g-ink .finder{background:#17191F;color:#F4F1EA}
.rail{width:108px;display:flex;flex-direction:column;align-items:center;gap:28px;padding:32px 0;border-right:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03)}
.workspace{flex:1;display:flex;flex-direction:column;padding:28px 36px 32px;min-width:0}
.topbar{display:flex;align-items:center;justify-content:space-between;font-size:28px;font-weight:600;letter-spacing:-.04em;margin-bottom:22px}
.topbar.bare{padding:8px 8px 0}
.chip{display:flex;align-items:center;gap:10px;border:2px solid currentColor;border-radius:999px;padding:10px 18px;font-size:20px;font-weight:500}
.statrow{display:flex;gap:18px}
.stat{flex:1;background:#fff;border-radius:18px;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,.06);min-height:150px;display:flex;flex-direction:column;justify-content:space-between;font-size:26px;font-weight:600;letter-spacing:-.04em}
.g-ink .stat{background:#22252E;box-shadow:none}
.mini{display:flex;align-items:flex-end;gap:8px;height:54px}
.mini i,.chart i,.mchart i{display:block;width:100%;background:#1A1A1A;border-radius:8px 8px 0 0;height:0}
.mini i{width:18px;background:var(--accent)}
.g-ink .mini i{background:var(--accent)}
.chartcard{flex:1;display:flex;gap:28px;margin-top:22px;min-height:0}
.chart,.mchart{flex:1.2;display:flex;align-items:flex-end;gap:16px;background:#fff;border-radius:20px;padding:28px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
.g-ink .chart{background:#22252E}
.chart i[data-hot],.mchart i[data-hot]{background:var(--accent)}
.feed{flex:1;display:flex;flex-direction:column;gap:14px;justify-content:center}
.feedrow,.result,.mitem,.trow{display:flex;align-items:center;gap:14px;font-size:28px;font-weight:550;letter-spacing:-.03em}
.files{width:320px;background:#12141A;color:#F4F1EA;padding:28px 18px;display:flex;flex-direction:column;gap:8px}
.files div{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:12px;font-size:22px}
.files .on{background:var(--accent);color:#fff}
.codepane{flex:1;display:flex;flex-direction:column;background:#16181E;color:#F4F1EA}
.tabs{display:flex;gap:8px;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.08);font-size:20px}
.tabs .on{background:rgba(255,255,255,.08);border-radius:8px;padding:6px 12px}
.codebody{flex:1;padding:36px 18px;display:flex;flex-direction:column;justify-content:center;gap:26px;font-size:42px;font-weight:500;letter-spacing:-.03em}
.src b{color:#7DDEBA;font-weight:600}
.status{display:flex;justify-content:space-between;padding:12px 22px;border-top:1px solid rgba(255,255,255,.08);color:#9AA0AC;font-size:16px;letter-spacing:.08em;text-transform:uppercase}
.codeline{display:flex;gap:18px;align-items:center}
.codeline em{width:48px;text-align:right;font-style:normal;color:#8B909C;font-size:22px}
.codeline span{color:#D6E2FF}
.threads{width:420px;border-right:1px solid rgba(0,0,0,.08);padding:28px 18px;display:flex;flex-direction:column;gap:8px}
.threads b{font-size:28px;margin-bottom:12px}
.threads div{display:flex;gap:12px;align-items:center;padding:16px;border-radius:14px;font-size:22px}
.threads .on{background:rgba(0,0,0,.06)}
.thread{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:22px;padding:48px 56px 40px}
.bubble{max-width:86%;padding:32px 36px;border-radius:28px;font-size:48px;font-weight:600;letter-spacing:-.04em;line-height:1.05;box-shadow:0 18px 50px rgba(0,0,0,.12)}
.composer{margin-top:auto;display:flex;align-items:center;gap:16px;border:2px solid rgba(0,0,0,.2);border-radius:18px;padding:18px 22px;font-size:28px;font-weight:600}
.bubble.them{background:#fff;align-self:flex-start}
.bubble.me{background:var(--accent);color:#fff;align-self:flex-end}
.notewrap{flex-direction:column;gap:0;align-items:center}
.note{width:min(1180px,90%);display:flex;gap:22px;align-items:center;background:#fff;color:#161616;border-radius:28px;padding:32px 36px;box-shadow:0 30px 80px rgba(0,0,0,.28);margin-top:-36px}
.note small{display:block;font-size:18px;letter-spacing:.12em;text-transform:uppercase;opacity:.6;margin-bottom:6px}
.note b{font-size:44px;letter-spacing:-.04em;font-weight:600}
.badge{width:64px;height:64px;border-radius:18px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;flex:none}
.board{flex-direction:column;padding:28px}
.cols{flex:1;display:flex;gap:18px;min-height:0}
.col{flex:1;background:rgba(0,0,0,.04);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}
.col header{font-size:22px;font-weight:600;letter-spacing:-.03em;padding:8px}
.col article{background:#fff;border-radius:16px;padding:20px;min-height:120px;box-shadow:0 12px 30px rgba(0,0,0,.08);display:flex;flex-direction:column;gap:12px;font-size:26px;font-weight:600;letter-spacing:-.03em}
.g-ink .col article{background:#22252E}
.col article.lift{outline:3px solid var(--accent);transform:translateY(-8px)}
.col article.ghost{opacity:.55;font-weight:500}
.tlist{display:flex;flex-direction:column;gap:8px;justify-content:center;flex:1}
.trow{justify-content:space-between;background:#fff;border-radius:16px;padding:22px 26px;font-size:32px;box-shadow:0 8px 24px rgba(0,0,0,.05)}
.g-ink .trow{background:#22252E}
.switch{width:84px;height:48px;border-radius:99px;background:#DDD;position:relative;display:block;flex:none}
.switch i{position:absolute;top:6px;left:6px;width:36px;height:36px;border-radius:99px;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,.15)}
.switch.on{background:var(--accent)}
.finder{flex-direction:column;padding:42px 48px}
.bigfield{display:flex;align-items:center;gap:16px;border:3px solid #161616;border-radius:20px;padding:22px 28px;font-size:48px;font-weight:600;letter-spacing:-.04em;min-height:108px}
.g-ink .bigfield{border-color:#F4F1EA}
.findbody{flex:1;display:flex;gap:28px;margin-top:22px;min-height:0}
.results{flex:1.1;display:flex;flex-direction:column}
.detail{flex:0.9;border-radius:24px;background:#161616;color:#F4F1EA;padding:36px;display:flex;flex-direction:column;justify-content:flex-end;gap:18px}
.detailkicker{letter-spacing:.14em;text-transform:uppercase;font-size:18px;opacity:.7}
.detailbig{font-size:64px;font-weight:600;letter-spacing:-.05em;line-height:.95}
.result{padding:22px 8px;border-bottom:1px solid rgba(0,0,0,.08);font-size:32px}
.result.on{background:color-mix(in srgb, var(--accent) 16%, transparent);border-radius:14px;padding-left:16px}
.result .ico:last-child{margin-left:auto}
.orbitwrap{position:absolute}
.hub{width:280px;height:280px;border-radius:999px;background:var(--accent);color:var(--on);display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:600;letter-spacing:-.05em;box-shadow:0 30px 80px rgba(0,0,0,.25);z-index:2}
.hub .logo{width:150px;height:150px}
.orb{position:absolute;left:50%;top:50%;margin:-42px 0 0 -42px;width:84px;height:84px;border-radius:24px;background:#fff;color:#161616;display:flex;align-items:center;justify-content:center;box-shadow:0 16px 40px rgba(0,0,0,.16)}
.cycler{justify-content:space-between;padding:72px 80px;gap:48px}
.hero{flex:1;font-weight:600;letter-spacing:-.06em;line-height:.9}
.menu{width:46%;position:relative;display:flex;flex-direction:column;gap:8px;padding-left:72px}
.mitem{height:84px;border-radius:16px;padding:0 22px;font-size:32px}
.mitem.on{background:var(--accent);color:#fff}
.arrow{position:absolute;left:0;top:24px}
.metric{padding:72px 80px;gap:48px;justify-content:space-between}
.mleft{flex:1}
.mleft small{display:block;font-size:36px;font-weight:500;letter-spacing:-.03em;margin-bottom:12px}
.num{font-size:280px;font-weight:600;letter-spacing:-.07em;line-height:.84}
.mchart{height:70%;min-width:42%}
.halves{padding:0}
.half{flex:1;height:100%;display:flex;align-items:center;justify-content:center;padding:64px}
.half.ink{background:#0C0D10;color:#F4F1EA}
.half.paper{background:#E4E1DA;color:#141414}
.halfbig{font-size:128px}
.seam{position:absolute;left:50%;top:8%;bottom:8%;width:8px;margin-left:-4px;background:var(--accent);border-radius:99px;transform-origin:50% 100%}
.logowrap,.endwrap{flex-direction:column;gap:28px}
.dot{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px;border-radius:4px;background:var(--accent)}
.g-accent .dot{background:var(--on)}
.wordmark{font-size:220px;font-weight:600;letter-spacing:-.06em}
.biglogo{width:220px;height:220px;object-fit:contain}
.host{font-size:128px;font-weight:600;letter-spacing:-.05em}
.sample{letter-spacing:.18em;text-transform:uppercase;font-size:18px;opacity:.75}
.ribbon{position:absolute;left:0;right:0;bottom:28px;overflow:hidden;white-space:nowrap;font-size:22px;font-weight:600;letter-spacing:-.03em;opacity:.72;pointer-events:none}
.ribbon span{display:inline-block}
.burst{position:absolute;left:50%;top:50%;width:100px;height:100px;margin:-50px;border-radius:24px;opacity:0;z-index:5}
.ico{display:block;flex:none}
</style></head><body class="${frame.portrait ? "portrait" : "landscape"}" data-ground="paper" data-director="1" data-type="${style.type}" data-ease="${style.ease}" data-bg="${style.ground}" data-colour="${style.colour}" data-shape="${style.shape}" data-density="${style.density}" data-pace="${style.pace}" data-face="${style.face}">
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
    frame: frame.portrait ? "portrait" : "landscape",
    layouts,
  };
}
