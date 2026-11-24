import { rulePlan, validatePlan } from "./plan.js";

/** Public list price for gpt-4o-mini, per token. Override with HARKAT_LLM_PRICE_IN / _OUT (dollars per token). */
const PRICE_IN = Number(process.env.HARKAT_LLM_PRICE_IN || 0.15) / 1_000_000;
const PRICE_OUT = Number(process.env.HARKAT_LLM_PRICE_OUT || 0.6) / 1_000_000;

function keyAndBase() {
  if (process.env.HARKAT_LLM_API_KEY) {
    return {
      key: process.env.HARKAT_LLM_API_KEY,
      base: (process.env.HARKAT_LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    };
  }
  if (process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return { key: process.env.GROQ_API_KEY, base: "https://api.groq.com/openai/v1" };
  }
  if (process.env.OPENAI_API_KEY) {
    return { key: process.env.OPENAI_API_KEY, base: (process.env.HARKAT_LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "") };
  }
  return null;
}

export function plannerPrompt(brief, siteText = "") {
  return [
    "You plan beats for a short product film. Reply with JSON only, no markdown.",
    'Schema: {"scenes":[{"type":"problem|intro|benefit|proof|cta","copy":"1 to 6 words from the brief","highlight":"one word from copy","vignette":"code|search|toggle|chart|chat|cards|limit"}]}',
    "Use only words that already appear in the brief or the site text. Do not invent numbers, customers, awards, or results.",
    "Do not write HTML, CSS, JavaScript, or animation.",
    "Include one intro, the benefits, a proof beat only if a proof stat is present or the goal is a launch, and always end with cta whose copy is the hostname.",
    JSON.stringify({
      name: brief.name,
      problem: brief.problem,
      features: brief.features,
      audience: brief.audience,
      goal: brief.goal,
      tone: brief.tone,
      length: brief.length,
      proof: brief.proof,
      hostname: brief.hostname,
      site: String(siteText || "").slice(0, 1200),
    }),
  ].join("\n");
}

export function estimatePlannerCost(brief, siteText = "") {
  const inputTokens = Math.ceil(plannerPrompt(brief, siteText).length / 4) + 90;
  const outputTokens = 180;
  return {
    inputTokens,
    outputTokens,
    usd: inputTokens * PRICE_IN + outputTokens * PRICE_OUT,
    priceInPerToken: PRICE_IN,
    priceOutPerToken: PRICE_OUT,
  };
}

function logCost(source, inputTokens, outputTokens, usd) {
  console.info(`harkat planner source=${source} in=${inputTokens} out=${outputTokens} usd=${usd.toFixed(6)}`);
}

/** Optional. Off unless an API key is set. Never writes animation. Falls back to the rule plan. */
export async function planWithModel(brief, opts = {}) {
  const estimate = estimatePlannerCost(brief, opts.siteText || "");
  const auth = keyAndBase();
  if (!auth || opts.model === false) {
    logCost("rules", 0, 0, 0);
    return { plan: rulePlan(brief), source: "rules", cost: 0, tokens: { in: 0, out: 0 }, estimate };
  }
  const model = process.env.HARKAT_LLM_MODEL || (auth.base.includes("groq.com") ? "llama-3.3-70b-versatile" : "gpt-4o-mini");
  const fetchImpl = opts.fetchImpl || fetch;
  try {
    const res = await fetchImpl(`${auth.base}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(opts.timeout ?? 8000),
      headers: { Authorization: `Bearer ${auth.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 400,
        messages: [
          { role: "system", content: "You output one JSON object and nothing else. You never write code." },
          { role: "user", content: plannerPrompt(brief, opts.siteText || "") },
        ],
      }),
    });
    if (!res.ok) throw new Error("planner http");
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < start) throw new Error("planner json");
    const parsed = JSON.parse(text.slice(start, end + 1));
    const checked = validatePlan(parsed, brief);
    if (!checked.ok) throw new Error(checked.reason);
    const inputTokens = Number(data?.usage?.prompt_tokens) || estimate.inputTokens;
    const outputTokens = Number(data?.usage?.completion_tokens) || estimate.outputTokens;
    const usd = inputTokens * PRICE_IN + outputTokens * PRICE_OUT;
    logCost("model", inputTokens, outputTokens, usd);
    return { plan: checked.plan, source: "model", cost: usd, tokens: { in: inputTokens, out: outputTokens }, estimate };
  } catch (err) {
    logCost("rules-fallback", 0, 0, 0);
    return { plan: rulePlan(brief), source: "rules", cost: 0, tokens: { in: 0, out: 0 }, estimate, reason: err.message };
  }
}
