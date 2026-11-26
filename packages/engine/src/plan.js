import { clipWords, countWords } from "./copy.js";

export const SCENE_TYPES = ["problem", "intro", "benefit", "proof", "cta"];
export const VIGNETTES = ["limit", "code", "search", "toggle", "chart", "chat", "cards"];
const ALLOW = new Set(["introducing", "limit", "reached", "open", "sample", "for", "the", "a", "an", "to", "up", "and", "your"]);

export function hash(text) {
  let h = 2166136261;
  const s = String(text);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function highlightOf(words) {
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.length > 2 && !ALLOW.has(w.toLowerCase())) return w;
  }
  return words.at(-1) || "";
}

/** Words the planner may show, plus the digits those words contain. `extra` is scraped site copy. */
export function corpusOf(brief, extra = "") {
  const text = [brief.name, brief.problem, brief.audience, brief.proof, ...(brief.features || []), brief.hostname, extra].join(" ");
  const tokens = text.toLowerCase().match(/[a-z0-9'%+.-]+/g) ?? [];
  const have = new Set(tokens);
  for (const token of tokens) have.add(token.replace(/[.'%+]+$/g, ""));
  return {
    have,
    digits: new Set(text.match(/\d+(?:\.\d+)?/g) ?? []),
  };
}

export function wordOk(word, have, digits, allow = ALLOW) {
  const bare = String(word).toLowerCase().replace(/[^a-z0-9'%+.-]/g, "");
  const stem = bare.replace(/%$/, "");
  if (!bare) return false;
  if (allow.has(bare) || allow.has(stem)) return true;
  if (have.has(bare) || have.has(stem)) return true;
  const n = stem.match(/\d+(?:\.\d+)?/)?.[0];
  if (n && digits.has(n) && stem.replace(n, "").replace(/[%+.-]/g, "") === "") return true;
  return false;
}

export function vignetteFor(text, brief, used) {
  const t = String(text).toLowerCase();
  let v = "cards";
  if (/find|search|\blook/.test(t)) v = "search";
  else if (/flip|approv|toggle|switch|\bsend/.test(t)) v = "toggle";
  else if (/reply|draft|message|inbox|\bchat|\bmail/.test(t)) v = "chat";
  else if (/chart|metric|graph|\bstat|\bdiff/.test(t)) v = "chart";
  else if (/\btype|\bcode|\bapi|\bbug|\bship|commit/.test(t)) v = "code";
  else if (/card|board|queue|\blist/.test(t)) v = "cards";
  else {
    const pool = brief.goal === "feature"
      ? ["chat", "toggle", "search", "cards"]
      : brief.goal === "explainer"
        ? ["cards", "chart", "chat", "toggle"]
        : ["code", "search", "chart", "cards"];
    v = pool[hash(`${brief.name}:${text}`) % pool.length];
  }
  if (used.has(v)) {
    const pool = ["cards", "chat", "search", "toggle", "code", "chart"];
    v = pool.find((item) => !used.has(item)) || v;
  }
  used.add(v);
  return v;
}

function wantsProof(brief) {
  return Boolean(brief.proof) || (brief.goal !== "feature" && brief.length > 15);
}

/** Deterministic scene list. Copy is clipped from the brief. No animation code. */
export function rulePlan(brief) {
  const scenes = [];
  const nFeat = brief.length === 15 ? Math.min(2, brief.features.length) : brief.length === 30 ? Math.min(3, brief.features.length) : Math.min(4, brief.features.length);
  const feats = brief.features.slice(0, nFeat);
  const used = new Set();
  if (wantsProof(brief)) used.add("chart");

  if (brief.goal !== "feature") {
    const words = clipWords(brief.problem, 4);
    scenes.push({ type: "problem", copy: words.join(" "), highlight: highlightOf(words), vignette: "limit" });
  }
  const name = clipWords(brief.name, 3);
  scenes.push({ type: "intro", copy: name.join(" ") || brief.name, highlight: "" });

  for (const feature of feats) {
    const words = clipWords(feature, 4);
    scenes.push({
      type: "benefit",
      copy: words.join(" "),
      highlight: highlightOf(words),
      vignette: vignetteFor(feature, brief, used),
    });
  }

  if (wantsProof(brief)) {
    const source = brief.proof || feats.at(-1) || brief.name;
    const words = clipWords(source, 4);
    scenes.push({ type: "proof", copy: words.join(" "), highlight: highlightOf(words), vignette: "chart" });
  }

  scenes.push({ type: "cta", copy: brief.hostname, highlight: "" });
  return { goal: brief.goal, length: brief.length, tone: brief.tone, scenes };
}

export function validatePlan(plan, brief, siteText = "") {
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.scenes)) return { ok: false, reason: "Plan needs a scenes list." };
  if (plan.scenes.length < 3 || plan.scenes.length > 10) return { ok: false, reason: "Plan needs between 3 and 10 scenes." };
  const { have, digits: allowedDigits } = corpusOf(brief, siteText);
  const scenes = [];
  for (const scene of plan.scenes) {
    if (!scene || typeof scene !== "object") return { ok: false, reason: "A scene is missing." };
    const keys = Object.keys(scene);
    if (keys.some((key) => !["type", "copy", "highlight", "vignette"].includes(key))) {
      return { ok: false, reason: "A scene has a field the planner is not allowed to set." };
    }
    if (!SCENE_TYPES.includes(scene.type)) return { ok: false, reason: "Unknown scene type." };
    const copy = String(scene.copy ?? "").replace(/\s+/g, " ").trim();
    if (!copy || countWords(copy) > 6 || countWords(copy) < 1) return { ok: false, reason: "Each beat needs 1 to 6 words." };
    if (/[<>]/.test(copy)) return { ok: false, reason: "Scene copy cannot carry markup." };
    const words = copy.split(" ");
    if (words.some((word) => word.length > 24)) return { ok: false, reason: "A word is too long." };
    if (!words.every((word) => wordOk(word, have, allowedDigits))) return { ok: false, reason: "Scene copy uses words that are not in the brief." };
    const digits = copy.match(/\d+(?:\.\d+)?/g) ?? [];
    if (digits.some((n) => !allowedDigits.has(n))) return { ok: false, reason: "Scene copy adds a number that is not in the brief." };
    let highlight = "";
    if (scene.highlight) {
      highlight = String(scene.highlight).trim();
      if (countWords(highlight) !== 1 || !words.some((word) => word.toLowerCase() === highlight.toLowerCase())) {
        return { ok: false, reason: "Highlight must be one word from that beat." };
      }
    }
    let vignette = "";
    if (scene.vignette) {
      if (!VIGNETTES.includes(scene.vignette)) return { ok: false, reason: "Unknown vignette." };
      vignette = scene.vignette;
    }
    scenes.push({ type: scene.type, copy, highlight, vignette });
  }
  if (!scenes.some((scene) => scene.type === "cta")) return { ok: false, reason: "Plan needs a closing card." };
  return { ok: true, plan: { goal: brief.goal, length: brief.length, tone: brief.tone, scenes } };
}
