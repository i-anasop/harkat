import { esc, lineSize, wordsHtml } from "./copy.js";
import { assertClear, contentRatio, FRAME_H, FRAME_W, row, stack } from "./layout.js";

const TX = ["scale", "morph", "whip", "cut"];

function zoomOf(brief) {
  if (brief.tone === "bold") return 0.05;
  if (brief.tone === "quiet") return 0.03;
  return 0.04;
}

function lineEl(id, words, role, size, weight, highlight) {
  const box = lineSize(words, size, weight);
  return {
    id,
    role,
    className: role,
    w: box.w,
    h: box.h,
    area: true,
    size,
    html: wordsHtml(words, role === "headline" ? highlight : ""),
  };
}

function placeCenter(el) {
  return { ...el, x: Math.round((FRAME_W - el.w) / 2), y: Math.round((FRAME_H - el.h) / 2) };
}

function wordsIn(elements) {
  const text = elements
    .map((el) => String(el.html || "").replace(/<[^>]+>/g, " "))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ") : [];
}

function finish(kind, play, mode, elements, brief) {
  assertClear(elements);
  const words = wordsIn(elements);
  if (words.length > 6) throw new Error(`Too many words on one beat (${words.length}). The film was not rendered.`);
  return { kind, play, mode, elements, words, zoom: zoomOf(brief), ratio: contentRatio(elements) };
}

function typeShot(kind, words, highlight, brief) {
  const line = lineEl(`${kind}-line`, words, "headline", 118, 800, highlight);
  return finish(kind, "", "light", stack([line]), brief);
}

function limitShot(brief) {
  const line = lineEl("limit-line", ["Limit", "reached"], "headline", 118, 800, "");
  const card = {
    id: "limit-card",
    role: "shape",
    className: "card bars",
    w: 820,
    h: 250,
    area: true,
    at: 0.12,
    html: `<div class="meter"><i data-h="36"></i><i data-h="58"></i><i data-h="100" data-hot="1"></i></div>`,
  };
  return finish("limit", "bars", "light", stack([line, card], 80), brief);
}

function introShot(brief, name) {
  const items = [];
  if (brief.logo) {
    items.push({ id: "logo", className: "logobox", w: 96, h: 96, area: true, html: `<img class="logo" alt="">` });
  }
  items.push(lineEl("kicker", ["Introducing"], "sub", 28, 400, ""));
  items.push(lineEl("name", name, "headline", 118, 800, ""));
  return finish("intro", "", "light", stack(items, 72), brief);
}

function proofShot(scene, brief) {
  const words = scene.copy.split(" ").filter(Boolean);
  const idx = words.findIndex((word) => /\d/.test(word));
  if (idx > 0) {
    const sub = lineEl("proof-sub", words.slice(0, idx), "sub", 28, 400, "");
    const head = lineEl("proof-head", words.slice(idx), "headline", 118, 800, scene.highlight);
    return finish("proof", "", "light", stack([sub, head], 72), brief);
  }
  return typeShot("proof", words, scene.highlight, brief);
}

function vignette(scene, brief) {
  const copy = scene.copy;
  const v = scene.vignette || "cards";
  if (v === "code") {
    const words = copy.split(" ");
    const mid = Math.max(1, Math.ceil(words.length / 2));
    const a = words.slice(0, mid).join(" ");
    const b = words.slice(mid).join(" ");
    const second = b ? `<span data-line="${esc(b)}">${esc(b)}</span>` : "";
    const card = placeCenter({
      id: "code",
      role: "shape",
      className: "card codeCard",
      w: 860,
      h: 300,
      area: true,
      at: 0.08,
      html: `<pre class="code" data-role="ui"><span data-line="${esc(a)}">${esc(a)}</span>${second}</pre>`,
    });
    return finish("vignette", "type", "dark", [card], brief);
  }
  if (v === "search") {
    const card = placeCenter({
      id: "search",
      role: "shape",
      className: "card search",
      w: 980,
      h: 230,
      area: true,
      at: 0.08,
      html: `<div class="query" data-role="ui"><span data-line="${esc(copy)}">${esc(copy)}</span></div>`,
    });
    return finish("vignette", "search", "light", [card], brief);
  }
  if (v === "toggle") {
    const card = placeCenter({
      id: "toggle",
      role: "shape",
      className: "card toggle",
      w: 920,
      h: 240,
      area: true,
      at: 0.08,
      html: `<div class="tog"><span data-role="ui">${wordsHtml(copy.split(" "), "", 0.16)}</span><i class="track"><i class="knob"></i></i></div>`,
    });
    return finish("vignette", "toggle", "light", [card], brief);
  }
  if (v === "chat") {
    const card = placeCenter({
      id: "chat",
      role: "shape",
      className: "card chat",
      w: 780,
      h: 280,
      area: true,
      at: 0.08,
      html: `<div class="bubble" data-role="ui">${wordsHtml(copy.split(" "), "", 0.14)}</div>`,
    });
    return finish("vignette", "chat", "light", [card], brief);
  }
  if (v === "chart") {
    const card = placeCenter({
      id: "chart",
      role: "shape",
      className: "card bars",
      w: 760,
      h: 380,
      area: true,
      at: 0.08,
      html: `<div class="meter tall"><i data-h="32"></i><i data-h="54"></i><i data-h="100" data-hot="1"></i></div>`,
    });
    return finish("vignette", "chart", "light", [card], brief);
  }
  const words = copy.split(" ").filter(Boolean).slice(0, 3);
  const wide = words.length === 1 ? 860 : words.length === 2 ? 440 : 320;
  const tall = words.length < 3 ? 280 : 230;
  const cards = words.map((word, i) => ({
    id: `deck${i}`,
    role: "shape",
    className: "card deck",
    w: wide,
    h: tall,
    area: true,
    stack: "deck",
    at: (0.06 + i * 0.14).toFixed(2),
    html: `<span class="deckWord" data-word data-delay="${(0.14 + i * 0.15).toFixed(2)}" data-role="ui">${esc(word)}</span>`,
  }));
  return finish("vignette", "cards", "light", row(cards, 64, Math.round((FRAME_H - tall) / 2)), brief);
}

function ctaShot(brief) {
  const bits = [];
  if (brief.logo) bits.push(`<img class="logo" alt="">`);
  bits.push(`<div class="host" data-role="sub" data-at="0.14">${esc(brief.hostname)}</div>`);
  bits.push(`<div class="btn" data-role="ui" data-at="0.3">Open</div>`);
  if (brief.sample !== false) bits.push(`<div class="mark" data-role="sub" data-at="0.46">Sample</div>`);
  const card = placeCenter({
    id: "cta",
    role: "shape",
    className: "card cta",
    w: 640,
    h: 500,
    area: true,
    at: 0.06,
    html: `<div class="ctaIn">${bits.join("")}</div>`,
  });
  return finish("cta", "", "light", [card], brief);
}

export function buildShots(brief, plan) {
  const shots = [];
  for (const scene of plan.scenes) {
    if (scene.type === "problem") {
      shots.push(typeShot("problem", scene.copy.split(" "), scene.highlight, brief));
      shots.push(limitShot(brief));
    } else if (scene.type === "intro") {
      shots.push(introShot(brief, scene.copy.split(" ").filter(Boolean)));
    } else if (scene.type === "benefit") {
      shots.push(typeShot("benefit", scene.copy.split(" "), scene.highlight, brief));
      shots.push(vignette(scene, brief));
    } else if (scene.type === "proof") {
      shots.push(proofShot(scene, brief));
      shots.push(vignette({ ...scene, vignette: "chart", copy: scene.copy }, brief));
    } else if (scene.type === "cta") {
      shots.push(ctaShot(brief));
    }
  }
  const n = shots.length;
  const length = plan.length || brief.length;
  const base = Math.round((length / n) * 100) / 100;
  let t = 0;
  return shots.map((shot, i) => {
    const dur = i === n - 1 ? Math.round((length - t) * 100) / 100 : base;
    const start = Math.round(t * 100) / 100;
    t = Math.round((start + dur) * 100) / 100;
    return { ...shot, start, dur, end: t, tx: TX[i % TX.length] };
  });
}
