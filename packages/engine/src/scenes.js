import { esc, lineSize, wordsHtml } from "./copy.js";
import { assertClear, contentRatio, FRAME_H, FRAME_W, stack } from "./layout.js";

const LONE = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "before", "with"]);
const TX = ["scale", "whip", "cut", "scale"];

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
  for (const el of elements) {
    const text = String(el.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const bits = text ? text.split(" ") : [];
    if (bits.length === 1 && LONE.has(bits[0].toLowerCase())) {
      throw new Error(`A card cannot be only the word “${bits[0]}”. The film was not rendered.`);
    }
  }
  const words = wordsIn(elements);
  if (words.length > 6) throw new Error(`Too many words on one beat (${words.length}). The film was not rendered.`);
  return { kind, play, mode, elements, words, zoom: zoomOf(brief), ratio: contentRatio(elements) };
}

function captionWords(brief, words) {
  const used = new Set(words.map((word) => word.toLowerCase()));
  const name = String(brief.name || "").split(" ").filter((word) => word && !used.has(word.toLowerCase())).slice(0, 2);
  if (name.length && words.length + name.length <= 6) return name;
  const audience = String(brief.audience || "").split(" ").filter((word) => word && !used.has(word.toLowerCase())).slice(0, 2);
  if (audience.length && words.length + audience.length <= 6) return audience;
  return [];
}

function typeShot(kind, words, highlight, brief) {
  const items = [];
  const caption = captionWords(brief, words);
  if (caption.length) items.push(lineEl(`${kind}-cap`, caption, "sub", 28, 400, ""));
  items.push({ ...lineEl(`${kind}-line`, words, "headline", 118, 800, highlight), seed: !highlight });
  return { ...finish(kind, "", "light", stack(items, 64), brief), seedBg: highlight ? "accent" : "paper" };
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
    seed: true,
    html: `<div class="meter"><i data-h="36"></i><i data-h="58"></i><i data-h="100" data-hot="1"></i></div>`,
  };
  return { ...finish("limit", "bars", "light", stack([line, card], 80), brief), seedBg: "paper" };
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

function splitPhrase(copy) {
  const words = copy.split(" ").filter(Boolean);
  const tail = words.at(-1) || "";
  if (words.length > 1 && !LONE.has(tail.toLowerCase())) return [words.slice(0, -1).join(" "), tail];
  return [copy, ""];
}

function vignette(scene, brief) {
  const copy = scene.copy;
  const v = scene.vignette || "cards";
  if (v === "code") {
    const [command, result] = splitPhrase(copy);
    const found = result ? `<span class="result" data-role="ui" data-at="1.25">${esc(result)}</span>` : "";
    const card = placeCenter({
      id: "code",
      role: "shape",
      className: "card codeCard",
      w: 880,
      h: 320,
      area: true,
      at: 0.08,
      seed: true,
      html: `<pre class="code" data-role="ui"><span data-line="${esc(command)}">${esc(command)}</span>${found}</pre>`,
    });
    return { ...finish("vignette", "type", "dark", [card], brief), seedBg: "ink" };
  }
  if (v === "search") {
    const rows = [];
    let count = copy.split(" ").length;
    for (const extra of [brief.name, brief.hostname]) {
      const bits = String(extra || "").split(" ").filter(Boolean);
      if (!bits.length || count + bits.length > 6) continue;
      rows.push(bits.join(" "));
      count += bits.length;
      if (rows.length === 2) break;
    }
    const list = rows.map((rowText, i) => `<div class="srow" data-role="ui" data-at="${(1.05 + i * 0.35).toFixed(2)}">${esc(rowText)}</div>`).join("");
    const card = placeCenter({
      id: "search",
      role: "shape",
      className: "card search",
      w: 920,
      h: 340,
      area: true,
      at: 0.08,
      seed: true,
      html: `<div class="query" data-role="ui"><span data-line="${esc(copy)}">${esc(copy)}</span></div><div class="rows">${list}</div>`,
    });
    return { ...finish("vignette", "search", "light", [card], brief), seedBg: "paper" };
  }
  if (v === "toggle") {
    const card = placeCenter({
      id: "toggle",
      role: "shape",
      className: "card toggle",
      w: 920,
      h: 280,
      area: true,
      at: 0.08,
      seed: true,
      html: `<div class="tog"><span data-role="ui">${esc(copy)}</span><i class="track"><i class="knob"></i></i></div><div class="preview" data-role="ui">Off</div>`,
    });
    return { ...finish("vignette", "toggle", "light", [card], brief), seedBg: "paper" };
  }
  if (v === "chat") {
    const card = placeCenter({
      id: "chat",
      role: "shape",
      className: "card chat",
      w: 820,
      h: 280,
      area: true,
      at: 0.08,
      seed: true,
      html: `<div class="bubble" data-role="ui">${esc(copy)}</div>`,
    });
    return { ...finish("vignette", "chat", "light", [card], brief), seedBg: "paper" };
  }
  if (v === "chart") {
    const num = copy.match(/\d+(?:\.\d+)?/);
    const suffix = /%/.test(copy) ? "%" : "";
    const label = copy.replace(/\d+(?:\.\d+)?%?/, "").replace(/\s+/g, " ").trim();
    const figure = num
      ? `<div class="metric" data-role="ui" data-count="${num[0]}" data-suffix="${suffix}">0${suffix}</div>`
      : `<div class="metric" data-role="ui">${esc(copy)}</div>`;
    const note = num && label ? `<div class="note" data-role="sub">${esc(label)}</div>` : "";
    const card = placeCenter({
      id: "chart",
      role: "shape",
      className: "card metricCard",
      w: 760,
      h: 400,
      area: true,
      at: 0.08,
      seed: true,
      html: `${figure}${note}<div class="meter tall"><i data-h="32"></i><i data-h="54"></i><i data-h="100" data-hot="1"></i></div>`,
    });
    return { ...finish("vignette", "chart", "light", [card], brief), seedBg: "paper" };
  }
  const card = placeCenter({
    id: "phrase",
    role: "shape",
    className: "card chat",
    w: 860,
    h: 260,
    area: true,
    at: 0.08,
    seed: true,
    html: `<div class="bubble" data-role="ui">${esc(copy)}</div>`,
  });
  return { ...finish("vignette", "cards", "light", [card], brief), seedBg: "paper" };
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
  let morphed = false;
  const timed = shots.map((shot, i) => {
    const dur = i === n - 1 ? Math.round((length - t) * 100) / 100 : base;
    const start = Math.round(t * 100) / 100;
    t = Math.round((start + dur) * 100) / 100;
    let tx = TX[i % TX.length];
    if (!morphed && shot.play && shot.play !== "bars" && shot.play !== "chart") {
      tx = "morph";
      morphed = true;
    }
    return { ...shot, start, dur, end: t, tx };
  });
  for (let i = 0; i < timed.length - 1; i++) {
    if (timed[i].tx === "scale") timed[i + 1].bg = timed[i].seedBg || "paper";
  }
  return timed;
}
