import { screenText } from "./halal.js";
import { clipWords, countWords } from "./copy.js";
import { corpusOf, hash, highlightOf, wordOk } from "./plan.js";

/** Layouts the stage can draw. The model picks these. It does not write HTML. */
export const LAYOUTS = [
  "scatter", "swap", "stack", "sentence", "sweep",
  "dashboard", "code", "chat", "notify", "kanban", "toggles", "search",
  "orbit", "cycler", "metric", "compare", "logo", "wipe", "end",
];
export const MOTIONS = ["letters", "mask", "rise", "scale", "stagger", "count", "draw", "type"];
export const CAMERAS = ["hold", "push", "pan"];
export const ENTERS = ["cut", "whip", "mask", "push", "scale"];
export const GROUNDS = ["paper", "ink", "accent"];
export const SFX = ["whoosh", "tick", "ui", "click", "thud", "chime"];
const ROLES = ["hook", "problem", "intro", "feature", "proof", "close"];

const ALIAS = {
  kinetic: "scatter",
  stage: "wipe",
  split: "compare",
  grid: "sentence",
  meter: "metric",
  checklist: "cycler",
  counter: "metric",
  flow: "orbit",
  lockup: "logo",
  ticker: "stack",
  chart: "metric",
  cards: "kanban",
  title: "scatter",
  cta: "end",
  type: "code",
  window: "dashboard",
  nodes: "orbit",
  bars: "metric",
  code: "code",
  logo: "logo",
};

const DEFAULT_MOTION = {
  scatter: "letters",
  swap: "type",
  stack: "stagger",
  sentence: "letters",
  sweep: "mask",
  dashboard: "stagger",
  code: "type",
  chat: "type",
  notify: "rise",
  kanban: "stagger",
  toggles: "stagger",
  search: "type",
  orbit: "draw",
  cycler: "stagger",
  metric: "count",
  compare: "mask",
  logo: "scale",
  wipe: "scale",
  end: "rise",
};

const DEFAULT_SFX = {
  scatter: "whoosh",
  swap: "tick",
  stack: "tick",
  sentence: "tick",
  sweep: "whoosh",
  dashboard: "click",
  code: "ui",
  chat: "ui",
  notify: "thud",
  kanban: "click",
  toggles: "click",
  search: "ui",
  orbit: "whoosh",
  cycler: "tick",
  metric: "ui",
  compare: "whoosh",
  logo: "ui",
  wipe: "whoosh",
  end: "chime",
};

/** A seed picks a different opening. Metric is skipped when the brief has no trailing number. */
export const PROGRAMS = [
  { id: "dev", treatment: "ink-open", rhythm: "tight", layouts: ["wipe", "scatter", "code", "search", "dashboard", "metric", "orbit", "end"] },
  { id: "field", treatment: "field", rhythm: "tight", layouts: ["wipe", "scatter", "compare", "kanban", "sentence", "stack", "logo", "end"] },
  { id: "assistant", treatment: "ink-open", rhythm: "tight", layouts: ["wipe", "chat", "search", "toggles", "notify", "cycler", "logo", "end"] },
  { id: "design", treatment: "paper", rhythm: "tight", layouts: ["scatter", "sentence", "kanban", "stack", "orbit", "compare", "logo", "end"] },
  { id: "saas", treatment: "paper", rhythm: "measured", layouts: ["sweep", "search", "cycler", "dashboard", "notify", "swap", "logo", "end"] },
  { id: "quiet", treatment: "paper", rhythm: "measured", layouts: ["logo", "search", "toggles", "chat", "compare", "end"] },
];

const GLUE = new Set(["introducing", "open", "sample", "for", "the", "a", "an", "to", "up", "and", "your", "limit", "reached", "on", "off"]);

export function extractJson(text) {
  const raw = String(text ?? "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();
  const obj = body.indexOf("{");
  const arr = body.indexOf("[");
  try {
    if (arr >= 0 && (obj < 0 || arr < obj)) {
      const end = body.lastIndexOf("]");
      if (end > arr) {
        const parsed = JSON.parse(body.slice(arr, end + 1));
        return Array.isArray(parsed) ? { shots: parsed } : parsed;
      }
    }
    if (obj < 0) return null;
    const end = body.lastIndexOf("}");
    if (end <= obj) return null;
    return JSON.parse(body.slice(obj, end + 1));
  } catch {
    return null;
  }
}

export function canonicalLayout(name) {
  const key = String(name || "").toLowerCase().trim();
  if (LAYOUTS.includes(key)) return key;
  return ALIAS[key] || "";
}

export function copyAllowed(text, brief, siteText = "") {
  const copy = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!copy || countWords(copy) < 1) return { ok: false, reason: "A line is empty." };
  if (countWords(copy) > 6) return { ok: false, reason: "A line is longer than 6 words." };
  if (/[<>]/.test(copy)) return { ok: false, reason: "A line contains markup." };
  const { have, digits } = corpusOf(brief, siteText);
  const words = copy.split(" ");
  if (words.some((word) => word.length > 32)) return { ok: false, reason: "A word is too long." };
  for (const word of words) {
    if (!wordOk(word, have, digits)) return { ok: false, reason: `“${word}” is not in the brief.` };
  }
  if (words.every((word) => GLUE.has(word.toLowerCase().replace(/[^a-z0-9']/g, "")))) {
    return { ok: false, reason: "A line needs a word from the brief." };
  }
  return { ok: true, copy };
}

function cleanRows(rows, brief, siteText) {
  const out = [];
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    const checked = copyAllowed(row, brief, siteText);
    if (checked.ok && countWords(checked.copy) <= 4) out.push(checked.copy);
    if (out.length === 3) break;
  }
  return out;
}

function defaultRows(brief) {
  return (brief.features || []).map((feature) => clipWords(feature, 3).join(" ")).filter(Boolean).slice(0, 3);
}

export function hasCount(brief) {
  return /\d/.test([brief.proof, brief.problem, ...(brief.features || [])].join(" "));
}

export function pickProgram(brief, seed = "0") {
  const pool = PROGRAMS.filter((program) => hasCount(brief) || !program.layouts.includes("metric"));
  const list = pool.length ? pool : PROGRAMS;
  return list[hash(`${seed}|${brief.name}|${brief.goal}|${brief.problem}`) % list.length];
}

function defaultGround(treatment, index, last) {
  if (index === last) return "accent";
  if (index === 0 && treatment === "ink-open") return "ink";
  if (index === 0 && treatment === "field") return "accent";
  return "paper";
}

function nextLayout(preferred, used, prev, isLast) {
  if (isLast) return "end";
  for (const layout of [...preferred, ...LAYOUTS]) {
    if (layout === "end" || layout === prev || used.has(layout)) continue;
    return layout;
  }
  return prev === "kinetic" ? "split" : "kinetic";
}

/** Lines clipped from the brief. Used when a model call does not return beats. */
export function beatsFromBrief(brief) {
  const beats = [];
  const problem = clipWords(brief.problem, 4);
  if (problem.length) beats.push({ role: "hook", copy: problem.join(" "), highlight: highlightOf(problem), rows: [] });
  const name = clipWords(brief.name, 3);
  beats.push({ role: "intro", copy: name.join(" ") || brief.name, highlight: "", rows: [] });
  const count = brief.length >= 30 ? 3 : 2;
  for (const feature of brief.features.slice(0, count)) {
    const words = clipWords(feature, 4);
    if (!words.length) continue;
    beats.push({ role: "feature", copy: words.join(" "), highlight: highlightOf(words), rows: [] });
  }
  if (brief.proof) {
    const words = clipWords(brief.proof, 4);
    if (words.length) beats.push({ role: "proof", copy: words.join(" "), highlight: highlightOf(words), rows: [] });
  }
  beats.push({ role: "close", copy: brief.hostname, highlight: "", rows: [] });
  const rows = defaultRows(brief);
  for (const beat of beats) {
    if (beat.role === "hook" || beat.role === "feature" || beat.role === "proof") beat.rows = rows;
  }
  return beats;
}

export function grammarDirection(brief, seed = "0", siteText = "") {
  const program = pickProgram(brief, seed);
  const beats = beatsFromBrief(brief);
  const shots = beats.map((beat, index) => ({
    ...beat,
    layout: program.layouts[Math.min(index, program.layouts.length - 1)],
  }));
  return normalizeDirection({ concept: program.id, treatment: program.treatment, rhythm: program.rhythm, shots }, brief, siteText, seed);
}

/**
 * Turn a model object into a shot list the stage can draw.
 * Copy that is not in the brief fails. Missing motion is filled from the seed's program.
 */
export function normalizeDirection(raw, brief, siteText = "", seed = "0") {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "The direction was empty." };
  const program = pickProgram(brief, seed);
  const treatment = ["paper", "ink-open", "field"].includes(raw.treatment) ? raw.treatment : program.treatment;
  const rhythm = raw.rhythm === "measured" ? "measured" : "tight";
  let concept = String(raw.concept || "").replace(/\s+/g, " ").trim().slice(0, 280);
  if (concept && !screenText(concept).ok) concept = "";
  const source = Array.isArray(raw.shots) ? raw.shots : null;
  if (!source) return { ok: false, reason: "The direction needs a shots list." };

  const cleaned = [];
  for (let i = 0; i < source.length && cleaned.length < 20; i++) {
    const shot = source[i] || {};
    const line = copyAllowed(shot.copy, brief, siteText);
    if (!line.ok) return { ok: false, reason: `Shot ${i + 1}: ${line.reason}` };
    const words = line.copy.split(" ");
    let highlight = String(shot.highlight || "").trim();
    if (!words.some((word) => word.toLowerCase() === highlight.toLowerCase())) highlight = highlightOf(words);
    if (GLUE.has(highlight.toLowerCase())) highlight = highlightOf(words.filter((word) => !GLUE.has(word.toLowerCase()))) || "";
    cleaned.push({
      role: ROLES.includes(shot.role) ? shot.role : "feature",
      copy: line.copy,
      highlight,
      rows: cleanRows(shot.rows, brief, siteText),
      layout: canonicalLayout(shot.layout),
      motion: MOTIONS.includes(shot.motion) ? shot.motion : "",
      camera: CAMERAS.includes(shot.camera) ? shot.camera : "",
      enter: ENTERS.includes(shot.enter) ? shot.enter : shot.camera === "whip" ? "whip" : "",
      ground: GROUNDS.includes(shot.ground) ? shot.ground : "",
      sfx: SFX.includes(shot.sfx) ? shot.sfx : "",
      weight: Math.min(3, Math.max(1, Number(shot.weight) || (rhythm === "measured" ? 2 : 1))),
    });
  }
  if (cleaned.length < 4) return { ok: false, reason: "A film needs at least 4 shots." };

  const last = cleaned.length - 1;
  cleaned[last] = {
    ...cleaned[last],
    role: "close",
    layout: "end",
    copy: brief.hostname,
    highlight: "",
    rows: [],
    ground: "accent",
    sfx: "chime",
    motion: cleaned[last].motion || "rise",
  };

  const used = new Set();
  for (let i = 0; i < cleaned.length; i++) {
    const shot = cleaned[i];
    if (i !== last && shot.layout === "end") shot.layout = "";
    if (!shot.layout || (i > 0 && shot.layout === cleaned[i - 1].layout)) {
      shot.layout = nextLayout(program.layouts, used, cleaned[i - 1]?.layout, i === last);
    }
    if (shot.layout === "metric" && !/\d+(?:\.\d+)?%?$/.test(shot.copy)) shot.layout = i === last ? "end" : "sweep";
    if (!shot.rows.length && ["dashboard", "checklist", "meter", "search", "flow", "ticker", "grid", "split"].includes(shot.layout)) {
      shot.rows = defaultRows(brief);
    }
    if (!shot.motion) shot.motion = DEFAULT_MOTION[shot.layout] || "rise";
    if (!shot.camera) shot.camera = ["push", "hold", "pan", "hold"][i % 4];
    if (!shot.enter) shot.enter = ["cut", "whip", "mask", "push", "scale"][i % 5];
    if (i > 0 && shot.enter === cleaned[i - 1].enter) {
      shot.enter = ENTERS.find((item) => item !== cleaned[i - 1].enter) || "cut";
    }
    if (!shot.ground) shot.ground = defaultGround(treatment, i, last);
    if (i === last) {
      shot.ground = "accent";
      shot.sfx = "chime";
      shot.layout = "end";
    } else if (!shot.sfx) shot.sfx = DEFAULT_SFX[shot.layout] || "tick";
    used.add(shot.layout);
  }

  return { ok: true, direction: { concept, treatment, rhythm, shots: cleaned, style: raw.style } };
}

export function acceptConcept(raw) {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "Concept JSON was empty." };
  const treatment = ["paper", "ink-open", "field"].includes(raw.treatment) ? raw.treatment : "";
  const rhythm = raw.rhythm === "measured" || raw.rhythm === "tight" ? raw.rhythm : "";
  if (!treatment || !rhythm) return { ok: false, reason: "Concept needs a treatment and a rhythm." };
  const layouts = (Array.isArray(raw.layouts) ? raw.layouts : []).map(canonicalLayout).filter(Boolean);
  if (layouts.length < 4) return { ok: false, reason: "Concept needs at least 4 layouts." };
  let concept = String(raw.concept || "").replace(/\s+/g, " ").trim().slice(0, 280);
  if (concept && !screenText(concept).ok) return { ok: false, reason: "That concept was refused." };
  if (!concept) concept = `${treatment} ${rhythm}`;
  return { ok: true, concept: { concept, treatment, rhythm, layouts, style: raw.style } };
}

export function acceptBeats(raw, brief, siteText = "") {
  const list = Array.isArray(raw?.beats) ? raw.beats : Array.isArray(raw?.shots) ? raw.shots : null;
  if (!list) return { ok: false, reason: "Beats need a list." };
  const beats = [];
  for (let i = 0; i < list.length && beats.length < 20; i++) {
    const line = copyAllowed(list[i]?.copy, brief, siteText);
    if (!line.ok) return { ok: false, reason: `Beat ${i + 1}: ${line.reason}` };
    beats.push({
      role: list[i].role,
      copy: line.copy,
      highlight: list[i].highlight || "",
      rows: list[i].rows || [],
    });
  }
  if (beats.length < 4) return { ok: false, reason: "Need at least 4 beats." };
  return { ok: true, beats };
}

export function acceptMotions(raw) {
  const list = Array.isArray(raw?.shots) ? raw.shots : null;
  if (!list || list.length < 4) return { ok: false, reason: "Shots need at least 4 layouts." };
  const known = list.filter((shot) => canonicalLayout(shot?.layout));
  if (known.length < 4) return { ok: false, reason: "Shots used unknown layouts." };
  return { ok: true, motions: list };
}
