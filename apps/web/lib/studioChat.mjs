import { briefFromPrompt } from "../../../packages/engine/src/prompt.js";
import { screenText } from "../../../packages/engine/src/halal.js";

const LENGTHS = new Set([15, 30, 45]);

const SMALL = /^(?:hey+|hi+|hello+|yo+|sup|hiya|howdy|thanks|thank you|cheers|ok(?:ay)?|cool|lol|haha|heya|mate|what'?s up|whats up|how are you|who are you|what can you do|help|good (?:morning|evening|afternoon))\b/i;

function words(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function lengthOf(value, fallback = 15) {
  const n = Number(value);
  return LENGTHS.has(n) ? n : fallback;
}

export function isSmallTalk(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  const n = words(t).length;
  if (SMALL.test(t) && n < 10) return true;
  if (n < 5 && !/\b(app|film|launch|product|saas|tool|site|startup|brand)\b/i.test(t)) return true;
  if (/^(what|how|who|why|when|where|can you)\b/i.test(t) && !/\b(app|product|film|launch|for|called|named)\b/i.test(t)) return true;
  return false;
}

function nudge(text) {
  const t = String(text || "").toLowerCase();
  if (/who are you|what can you do|help/.test(t)) return "I sketch 2D launch films. Describe the product in one line.";
  if (/how much|price|cost/.test(t)) return "A person finishes the film from $30. Tell me the product and I’ll draft a cut first.";
  if (/thank/.test(t)) return "Anytime. Describe the product when you want a film.";
  const lines = [
    "Hey. Tell me the product in one line and I’ll sketch a film.",
    "Hi. What should the film be about?",
    "I’m here. One line on the product is enough to start.",
  ];
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h + t.charCodeAt(i)) % lines.length;
  return lines[h];
}

function pushBeat(beats, line) {
  const t = String(line || "").replace(/\s+/g, " ").trim().slice(0, 90);
  if (!t) return;
  if (beats.some((b) => b.toLowerCase() === t.toLowerCase())) return;
  beats.push(t);
}

function tidy(line) {
  const t = String(line || "").replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
  if (!t) return "";
  return t[0].toUpperCase() + t.slice(1);
}

function withoutName(line, name) {
  if (!name) return line;
  const next = line.replace(new RegExp(`^${name}\\s+`, "i"), "");
  return next && next.length > 2 ? next : line;
}

/** Clauses of the user's own sentence. Conjunctions stay on the following clause. */
function clausesOf(text) {
  const parts = String(text || "").split(/(\s+(?:before|after|then|while|when|so that|so)\s+|,\s*|\s+and\s+)/i);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const piece = parts[i];
    if (/^\s+(?:before|after|then|while|when|so that|so)\s+$/i.test(piece) && parts[i + 1]) {
      out.push(`${piece} ${parts[i + 1]}`.replace(/\s+/g, " ").trim());
      i += 1;
    } else if (piece && !/^,?\s*(?:and)?\s*$/i.test(piece)) {
      const t = piece.replace(/\s+/g, " ").trim();
      if (t) out.push(t);
    }
  }
  return out.filter((s) => words(s).length >= 2);
}

export function planFromText(text, url, length) {
  const parsed = briefFromPrompt(text, url || "");
  if (!parsed.ok) return null;
  const beats = [];
  const name = parsed.name || "Film";
  const clauses = clausesOf(parsed.problem).map((line) => tidy(withoutName(line, name)));
  if (clauses.length > 1) {
    for (const clause of clauses) pushBeat(beats, clause);
  } else {
    const only = clauses[0] || tidy(parsed.problem);
    const bits = words(only);
    if (bits.length > 8) {
      for (let i = 0; i < bits.length && beats.length < 6; i += 4) pushBeat(beats, tidy(bits.slice(i, i + 4).join(" ")));
    } else if (only) {
      pushBeat(beats, only);
    }
  }
  const distinct = beats.filter((beat, i) => !beats.some((other, j) => j !== i && beat.length > other.length + 6 && beat.toLowerCase().includes(other.toLowerCase())));
  if (distinct.length < 2) return null;
  return {
    title: name,
    beats: distinct.slice(0, 6),
    length: lengthOf(length),
    colours: "",
  };
}

function lastPlan(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.plan?.beats?.length) return messages[i].plan;
  }
  return null;
}

function editPlan(plan, text, length) {
  const next = {
    title: plan.title,
    beats: [...plan.beats],
    length: lengthOf(text.match(/\b(15|30|45)\b/)?.[1] || length || plan.length),
    colours: plan.colours || "",
  };
  const title = text.match(/\b(?:title|call it|name it)\s+(?:to\s+)?["']?([^"'.\n]+)/i);
  if (title) next.title = title[1].trim().slice(0, 48);
  const colour = text.match(/#(?:[0-9a-fA-F]{6})/);
  if (colour) next.colours = colour[0];
  const add = text.match(/\b(?:add|include)\s+(.{4,80})/i);
  if (add && next.beats.length < 6) pushBeat(next.beats, add[1]);
  return next;
}

/**
 * A reply with no model. Greetings never become a film plan.
 * Returns { kind: "talk"|"plan"|"decline", text, plan? }.
 */
export function replyWithoutModel(messages, opts = {}) {
  const list = Array.isArray(messages) ? messages : [];
  const last = [...list].reverse().find((m) => m?.role === "user");
  const text = String(last?.text || "").trim().slice(0, 800);
  const screened = screenText(text);
  if (!screened.ok) return { kind: "decline", text: `${screened.reason} If it’s a halal product, tell me what it does.` };

  const previous = lastPlan(list.slice(0, -1));
  if (previous && words(text).length < 16 && /\b(shorter|longer|title|colour|color|beat|change|add|include|15|30|45|seconds)\b/i.test(text)) {
    const plan = editPlan(previous, text, opts.length);
    return { kind: "plan", text: "Updated. Press Make film when it looks right.", plan };
  }
  if (!text || isSmallTalk(text)) return { kind: "talk", text: nudge(text) };

  const plan = planFromText(text, opts.url, opts.length);
  if (!plan || plan.beats.length < 2) return { kind: "talk", text: "Say a little more about what the product does." };
  if (opts.colours && /^#[0-9A-Fa-f]{6}$/.test(opts.colours)) plan.colours = opts.colours;
  return { kind: "plan", text: "Here’s a short cut. Change anything, or make the film.", plan };
}

/** Split a model reply into the visible line and a JSON plan, if it sent one. */
export function parseModelReply(raw) {
  const text = String(raw || "").trim();
  const cut = text.split(/\n---\n?/);
  const visible = (cut[0] || "").trim();
  const jsonPart = cut.slice(1).join("\n");
  const start = jsonPart.indexOf("{");
  const end = jsonPart.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const data = JSON.parse(jsonPart.slice(start, end + 1));
      const kind = data.kind === "plan" || data.kind === "decline" ? data.kind : "talk";
      const beats = Array.isArray(data.beats) ? data.beats.map((b) => String(b).trim()).filter(Boolean).slice(0, 6) : [];
      const plan = kind === "plan" && beats.length
        ? { title: String(data.title || "Film").slice(0, 48), beats, length: lengthOf(data.length), colours: /^#[0-9A-Fa-f]{6}$/.test(data.colours || "") ? data.colours : "" }
        : null;
      return { kind: plan ? "plan" : kind === "decline" ? "decline" : "talk", text: visible || data.text || "", plan };
    } catch { /* fall through */ }
  }
  return { kind: "talk", text: visible || text, plan: null };
}

export const CHAT_SYSTEM = [
  "You are Harkat, a brief assistant for 2D product films.",
  "Write what the person should read, then a line that is exactly ---, then one JSON object.",
  "The readable part is 1 or 2 short sentences. No headings, no bullet lists, no long paragraphs.",
  "JSON schema: {\"kind\":\"talk\"|\"plan\"|\"decline\",\"title\":\"\",\"beats\":[],\"length\":15,\"colours\":\"\"}.",
  "kind talk: greetings, small talk, questions, or anything too vague for a film. Nudge them to describe the product. beats stays empty.",
  "kind plan: they described a product or asked to change a plan. beats is 4 to 6 one-line shots using only their words. title is the product name. length is 15, 30, or 45.",
  "kind decline: gambling, betting, alcohol, adult content, or drugs. Be polite and brief.",
  "Hard rules: no music, ever — sound effects only. 2D only. No fake customers, awards, or numbers. Never plan a film from a greeting.",
].join(" ");
