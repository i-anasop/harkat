import { corpusOf, hash } from "./plan.js";
import { completeChat, configuredProviders } from "./providers.js";
import { renderDirection } from "./stage.js";
import {
  acceptBeats,
  acceptConcept,
  acceptMotions,
  beatsFromBrief,
  canonicalLayout,
  extractJson,
  LAYOUTS as LAYOUT_NAMES,
  normalizeDirection,
} from "./dsl.js";

const LAYOUTS = LAYOUT_NAMES.join(", ");

const SYSTEM = [
  "You direct a 2D motion-graphics launch film. Reply with one JSON object and nothing else.",
  "Hard rules: no music, no photographs, no images of people, no 3D, no perspective.",
  "Do not invent customers, awards, or numbers. Every visible word must already be in the brief.",
  "Never write HTML, CSS, or JavaScript.",
].join(" ");

const cache = new Map();
const usage = { day: "", global: 0, ips: new Map() };

export function resetDirectorState() {
  cache.clear();
  usage.day = "";
  usage.global = 0;
  usage.ips = new Map();
}

export function filmSeed(brief, seed) {
  if (seed !== undefined && seed !== null && String(seed).trim()) return String(seed).trim().slice(0, 40);
  const day = new Date().toISOString().slice(0, 10);
  return String(hash(`${brief.name}|${brief.problem}|${brief.hostname}|${day}`));
}

function cacheKeyOf(brief, opts, seed) {
  return String(hash(JSON.stringify({
    n: brief.name,
    p: brief.problem,
    f: brief.features,
    a: brief.audience,
    proof: brief.proof,
    h: brief.hostname,
    g: brief.goal,
    t: brief.tone,
    l: brief.length,
    c: brief.accent,
    s: String(opts.siteText || "").slice(0, 400),
    font: opts.brandFont || "",
    seed,
  })));
}

function recall(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > 6 * 60 * 60 * 1000) {
    cache.delete(key);
    return null;
  }
  return hit.direction;
}

function remember(key, direction) {
  cache.set(key, { at: Date.now(), direction });
  while (cache.size > 100) cache.delete(cache.keys().next().value);
}

function roll(now) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (usage.day !== day) {
    usage.day = day;
    usage.global = 0;
    usage.ips = new Map();
  }
}

export function takeQuota(ip, now = Date.now()) {
  roll(now);
  const capIp = Number(process.env.HARKAT_DIRECTOR_IP_DAY || 8);
  const capAll = Number(process.env.HARKAT_DIRECTOR_GLOBAL_DAY || 40);
  const key = String(ip || "local").slice(0, 80);
  const count = usage.ips.get(key) || 0;
  if (count >= capIp || usage.global >= capAll) return false;
  usage.ips.set(key, count + 1);
  usage.global += 1;
  return true;
}

function brandBlock(brief, opts) {
  return JSON.stringify({
    name: brief.name,
    problem: brief.problem,
    features: brief.features,
    audience: brief.audience || "",
    proof: brief.proof || "",
    hostname: brief.hostname,
    goal: brief.goal,
    tone: brief.tone,
    length: brief.length,
    accent: brief.accent,
    logo: brief.logo ? "real" : "none",
    filmFont: "Geist",
    brandFont: opts.brandFont || "",
    site: String(opts.siteText || "").slice(0, 700),
    seed: opts.seed,
  });
}

function allowedWords(brief, siteText) {
  return [...corpusOf(brief, siteText).have].slice(0, 60).join(", ");
}

export function conceptPrompt(brief, opts) {
  return [
    "Task: concept",
    `Choose a film concept. JSON: {"concept":"one sentence, not shown","treatment":"paper|ink-open|field","rhythm":"tight|measured","layouts":["kinetic","meter","split","end"]}`,
    `Layout names: ${LAYOUTS}.`,
    "layouts: 5 to 8 names, no repeats, last is end. counter only if the brief has a number.",
    "ink-open starts on black. field starts on the brand colour. paper stays light until the end card.",
    "The seed must change the idea and the opening layout. Do not describe music, people, or 3D.",
    "Open on wipe, scatter, or sweep. Then product UI (dashboard, code, chat, search, kanban, toggles, notify). Then type (stack, swap, sentence, cycler) or orbit. End on end.",
    "Alternate ink and paper. A beat is about 2 to 3 seconds. Hook in the first shot. No blank grids. No tiny centered line as the whole frame.",
    `Seed: ${opts.seed}`,
    brandBlock(brief, opts),
  ].join("\n");
}

export function beatsPrompt(brief, opts, concept) {
  return [
    "Task: beats",
    "Write the lines for this concept. JSON: {\"beats\":[{\"role\":\"hook|problem|intro|feature|proof|close\",\"copy\":\"1 to 6 words\",\"highlight\":\"one word from copy or empty\",\"rows\":[\"optional short line\"]}]}",
    "Use only these words: " + allowedWords(brief, opts.siteText || ""),
    "The last beat copy is the hostname exactly. One intro uses the product name. Features come from the feature list.",
    `Concept: ${concept.concept}. Treatment: ${concept.treatment}. Layouts: ${concept.layouts.join(", ")}.`,
    brandBlock(brief, opts),
  ].join("\n");
}

export function shotsPrompt(brief, opts, concept, beats) {
  return [
    "Task: shots",
    "Set the camera for each beat, in order. JSON: {\"shots\":[{\"layout\":\"" + LAYOUTS.split(", ").join("|") + "\",\"motion\":\"letters|mask|rise|scale|stagger|count|draw|type\",\"camera\":\"hold|push|pan\",\"enter\":\"cut|whip|mask|push|scale\",\"ground\":\"paper|ink|accent\",\"sfx\":\"whoosh|tick|ui|click|thud|chime\",\"weight\":1}]}",
    "Do not repeat a layout. Do not repeat an enter. Last layout is end, ground accent, sfx chime.",
    "Rhythm: hook by 2 seconds, then a dense UI scene, then a type scene, then the hostname. Alternate ground ink and paper. Prefer wipe, scatter, code, chat, dashboard, search, kanban, notify, cycler, stack, swap, sentence, orbit, metric, compare, logo, end.",
    `Treatment: ${concept.treatment}. Seed: ${opts.seed}.`,
    JSON.stringify(beats.map((beat) => ({ role: beat.role, copy: beat.copy }))),
  ].join("\n");
}

export function filmPrompt(brief, opts) {
  return [
    "Task: film",
    "Return the whole film. JSON: {\"concept\":\"one sentence\",\"treatment\":\"paper|ink-open|field\",\"rhythm\":\"tight|measured\",\"shots\":[{\"role\":\"hook|intro|feature|proof|close\",\"layout\":\"" + LAYOUTS.split(", ").join("|") + "\",\"copy\":\"1 to 6 words from the brief\",\"highlight\":\"\",\"rows\":[],\"motion\":\"letters|mask|rise|scale|stagger|count|draw|type\",\"camera\":\"hold|push|pan\",\"enter\":\"cut|whip|mask|push|scale\",\"ground\":\"paper|ink|accent\",\"sfx\":\"whoosh|tick|ui|click|thud|chime\",\"weight\":2}]}",
    `${brief.length}s film: about one shot per 2.5 seconds (6 at 15s, 12 at 30s, 14 at 45s). No repeated layout. Last shot layout end, copy the hostname, ground accent, sfx chime.`,
    "Fill every frame. Alternate ink and paper. First shot is wipe, scatter, or sweep. Include at least two product UI layouts (dashboard, code, chat, search, kanban, toggles, notify).",
    "Dev tool: code then search. Fintech: wipe then dashboard. Assistant: chat then toggles. Design tool: sentence (icons in the line) then kanban. Do not repeat one sequence for every product.",
    "Words you may use: " + allowedWords(brief, opts.siteText || ""),
    `Seed: ${opts.seed}`,
    brandBlock(brief, opts),
  ].join("\n");
}

export function critiquePrompt(direction) {
  const shots = (direction.shots || []).map((shot, index) => ({ index, layout: shot.layout, role: shot.role, ground: shot.ground }));
  return [
    "Task: critique",
    "Review this shot list. JSON only: {\"notes\":\"one sentence\",\"swaps\":[{\"index\":1,\"layout\":\"chat\"}]}",
    "Change a layout only if two shots repeat, the first shot is not wipe or scatter or sweep, or a run of type scenes has no product UI.",
    "Do not change copy. swaps may be empty. Last index must stay end.",
    `Allowed layouts: ${LAYOUTS}.`,
    JSON.stringify(shots),
  ].join("\n");
}

function applySwaps(direction, swaps) {
  const shots = direction.shots.map((shot) => ({ ...shot }));
  for (const swap of swaps || []) {
    const index = Number(swap?.index);
    const layout = canonicalLayout(swap?.layout);
    if (!layout || !shots[index] || index === shots.length - 1 || layout === "end") continue;
    shots[index] = { ...shots[index], layout };
  }
  return { ...direction, shots };
}

function logLine(source, input, output, usd, note) {
  console.info(`harkat director source=${source} in=${input} out=${output} usd=${usd.toFixed(6)} note=${note}`);
}

export function compileDirection(brief, direction, opts = {}) {
  const seed = filmSeed(brief, opts.seed);
  const checked = normalizeDirection(direction, brief, opts.siteText || "", seed);
  if (!checked.ok) return checked;
  try {
    return { ok: true, ...renderDirection(brief, checked.direction, { ...opts, seed }), direction: checked.direction };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "This film could not be laid out." };
  }
}

function zip(concept, beats, motions) {
  return {
    concept: concept.concept,
    treatment: concept.treatment,
    rhythm: concept.rhythm,
    shots: beats.map((beat, index) => ({
      role: beat.role,
      copy: beat.copy,
      highlight: beat.highlight,
      rows: beat.rows,
      layout: motions?.[index]?.layout || concept.layouts?.[index] || "",
      motion: motions?.[index]?.motion,
      camera: motions?.[index]?.camera,
      enter: motions?.[index]?.enter,
      ground: motions?.[index]?.ground,
      sfx: motions?.[index]?.sfx,
      weight: motions?.[index]?.weight,
    })),
  };
}

function fromConcept(concept, brief) {
  return zip(concept, beatsFromBrief(brief), concept.layouts.map((layout) => ({ layout })));
}

async function ask(task, user, ctx) {
  const timeoutMs = Math.min(7000, ctx.deadline - Date.now() - 200);
  if (timeoutMs < 700) throw new Error("time");
  const cap = Number(process.env.HARKAT_DIRECTOR_TOKEN_BUDGET || 4500);
  if (ctx.spent.in + ctx.spent.out > cap) throw new Error("budget");
  const max = { concept: 380, beats: 800, shots: 1000, film: 1200, critique: 320 };
  const temp = { concept: 0.7, beats: 0.3, shots: 0.5, film: 0.6, critique: 0.2 };
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ];
  const first = await ctx.complete(messages, { maxTokens: max[task], temperature: temp[task], timeoutMs });
  ctx.add(first);
  let checked = ctx.check(task, extractJson(first.text));
  if (checked.ok || ctx.deadline - Date.now() < 2500) return checked;
  const second = await ctx.complete([
    ...messages,
    { role: "assistant", content: String(first.text || "").slice(0, 1800) },
    { role: "user", content: `That JSON failed: ${checked.reason} Return one corrected JSON object and nothing else.` },
  ], { maxTokens: max[task], temperature: 0.2, timeoutMs: Math.min(7000, ctx.deadline - Date.now() - 200) });
  ctx.add(second);
  checked = ctx.check(task, extractJson(second.text));
  return checked;
}

async function pipeline(brief, opts, ctx) {
  const forced = Number(opts.steps || process.env.HARKAT_DIRECTOR_STEPS || 0);
  const steps = forced === 1 || forced === 3 ? forced : (ctx.deadline - Date.now() >= 14000 ? 3 : 1);
  if (steps === 1) {
    const got = await ask("film", filmPrompt(brief, opts), ctx);
    if (!got.ok) throw new Error(got.reason || "film");
    return got.value;
  }
  const concept = await ask("concept", conceptPrompt(brief, opts), ctx);
  if (!concept.ok) throw new Error(concept.reason || "concept");
  if (ctx.deadline - Date.now() < 4000) return fromConcept(concept.value, brief);
  let beats;
  try {
    beats = await ask("beats", beatsPrompt(brief, opts, concept.value), ctx);
  } catch {
    beats = { ok: false };
  }
  const beatList = beats.ok ? beats.value : beatsFromBrief(brief);
  if (ctx.deadline - Date.now() < 4000) return zip(concept.value, beatList, null);
  let motions = { ok: false };
  try {
    motions = await ask("shots", shotsPrompt(brief, opts, concept.value, beatList), ctx);
  } catch {
    motions = { ok: false };
  }
  let direction = zip(concept.value, beatList, motions.ok ? motions.value : null);
  if (opts.critique !== false && ctx.deadline - Date.now() > 4500) {
    try {
      const critique = await ask("critique", critiquePrompt(direction), ctx);
      if (critique.ok) direction = applySwaps(direction, critique.value);
    } catch { /* a critique miss still ships the shot list */ }
  }
  return direction;
}

export function estimateDirectorCost(env = process.env) {
  const providers = configuredProviders(env);
  const inputTokens = 700 * 3;
  const outputTokens = 280 * 3;
  const top = providers[0];
  return {
    inputTokens,
    outputTokens,
    usd: top ? inputTokens * top.priceIn + outputTokens * top.priceOut : 0,
    provider: top?.id || "none",
  };
}

/** Model direction in, film HTML out. No key, a bad reply, or a full quota returns ok: false. */
export async function directFilm(brief, opts = {}) {
  if (opts.model === false || process.env.HARKAT_DIRECTOR === "0") return { ok: false, reason: "off" };
  const providers = opts.providers || configuredProviders();
  if (!providers.length) {
    logLine("rules", 0, 0, 0, "no-key");
    return { ok: false, reason: "no-key" };
  }
  const seed = filmSeed(brief, opts.seed);
  const key = cacheKeyOf(brief, opts, seed);
  if (opts.cache !== false) {
    const hit = recall(key);
    if (hit) {
      const made = compileDirection(brief, hit, { ...opts, seed });
      if (made.ok) {
        logLine("cache", 0, 0, 0, "cache");
        return { ok: true, film: made, cost: 0, tokens: { in: 0, out: 0 }, note: "cache" };
      }
    }
  }
  if (!takeQuota(opts.ip || "local")) {
    logLine("rules", 0, 0, 0, "quota");
    return { ok: false, reason: "quota" };
  }
  const spent = { in: 0, out: 0, usd: 0, providers: [] };
  const ctx = {
    deadline: Date.now() + (Number(opts.timeout) || 16000),
    spent,
    complete: (messages, call) => completeChat(messages, { ...call, providers, fetchImpl: opts.fetchImpl }),
    add(result) {
      spent.in += result.in || 0;
      spent.out += result.out || 0;
      spent.usd += (result.in || 0) * (result.priceIn || 0) + (result.out || 0) * (result.priceOut || 0);
      if (result.provider) spent.providers.push(result.provider);
    },
    check(task, parsed) {
      if (!parsed) return { ok: false, reason: "The reply was not JSON." };
      if (task === "concept") {
        const got = acceptConcept(parsed);
        return got.ok ? { ok: true, value: got.concept } : got;
      }
      if (task === "beats") {
        const got = acceptBeats(parsed, brief, opts.siteText || "");
        return got.ok ? { ok: true, value: got.beats } : got;
      }
      if (task === "shots") {
        const got = acceptMotions(parsed);
        return got.ok ? { ok: true, value: got.motions } : got;
      }
      if (task === "critique") {
        return { ok: true, value: Array.isArray(parsed.swaps) ? parsed.swaps : [] };
      }
      const got = normalizeDirection(parsed, brief, opts.siteText || "", seed);
      return got.ok ? { ok: true, value: got.direction } : got;
    },
  };
  try {
    const direction = await pipeline(brief, { ...opts, seed }, ctx);
    const made = compileDirection(brief, direction, { ...opts, seed });
    if (!made.ok) {
      logLine("rules", spent.in, spent.out, spent.usd, "invalid");
      return { ok: false, reason: made.reason, cost: spent.usd };
    }
    if (opts.cache !== false) remember(key, made.direction);
    const source = [...new Set(spent.providers)].join(",") || "model";
    logLine(source, spent.in, spent.out, spent.usd, "ok");
    return { ok: true, film: made, cost: spent.usd, tokens: { in: spent.in, out: spent.out }, note: source };
  } catch {
    logLine("rules", spent.in, spent.out, spent.usd, "fallback");
    return { ok: false, reason: "provider", cost: spent.usd };
  }
}
