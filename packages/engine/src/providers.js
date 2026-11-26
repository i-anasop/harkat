/**
 * Free-first chat providers. A paid key is used when it is the only key,
 * and is not a fallback behind a free key unless HARKAT_DIRECTOR_ALLOW_PAID=1.
 * Keys stay in the Authorization header. They are never logged or returned.
 */

export const PROVIDER_ENV = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
  "CEREBRAS_API_KEY",
  "MISTRAL_API_KEY",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "OPENAI_API_KEY",
  "HARKAT_LLM_API_KEY",
];

const perToken = (dollarsPerMillion) => Number(dollarsPerMillion || 0) / 1_000_000;

function present(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/** The providers a given env can call, free ones first. */
export function configuredProviders(env = process.env) {
  const list = [];
  const gemini = present(env, "GEMINI_API_KEY");
  if (gemini) {
    list.push({
      id: "gemini",
      tier: "free",
      key: gemini,
      base: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: present(env, "GEMINI_MODEL") || "gemini-3.5-flash-lite",
      priceIn: 0,
      priceOut: 0,
    });
  }
  const groq = present(env, "GROQ_API_KEY");
  if (groq) {
    list.push({
      id: "groq",
      tier: "free",
      key: groq,
      base: "https://api.groq.com/openai/v1",
      model: present(env, "GROQ_MODEL") || "openai/gpt-oss-120b",
      priceIn: 0,
      priceOut: 0,
      reasoning: "none",
    });
  }
  const openrouter = present(env, "OPENROUTER_API_KEY");
  if (openrouter) {
    list.push({
      id: "openrouter",
      tier: "free",
      key: openrouter,
      base: "https://openrouter.ai/api/v1",
      model: present(env, "OPENROUTER_MODEL") || "openrouter/free",
      priceIn: 0,
      priceOut: 0,
      headers: { "HTTP-Referer": present(env, "NEXT_PUBLIC_SITE_URL") || "https://harkat.ai", "X-Title": "Harkat" },
    });
  }
  const cfToken = present(env, "CLOUDFLARE_API_TOKEN");
  const cfAccount = present(env, "CLOUDFLARE_ACCOUNT_ID");
  if (cfToken && cfAccount) {
    list.push({
      id: "cloudflare",
      tier: "free",
      key: cfToken,
      base: `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/v1`,
      model: present(env, "CLOUDFLARE_AI_MODEL") || "@cf/meta/llama-3.1-8b-instruct",
      priceIn: 0,
      priceOut: 0,
    });
  }
  const cerebras = present(env, "CEREBRAS_API_KEY");
  if (cerebras) {
    list.push({
      id: "cerebras",
      tier: "paid",
      key: cerebras,
      base: "https://api.cerebras.ai/v1",
      model: present(env, "CEREBRAS_MODEL") || "qwen-3.8-27b",
      priceIn: perToken(0.25),
      priceOut: perToken(0.25),
      reasoning: "none",
    });
  }
  const mistral = present(env, "MISTRAL_API_KEY");
  if (mistral) {
    list.push({
      id: "mistral",
      tier: "paid",
      key: mistral,
      base: "https://api.mistral.ai/v1",
      model: present(env, "MISTRAL_MODEL") || "mistral-small-latest",
      priceIn: perToken(0.1),
      priceOut: perToken(0.3),
    });
  }
  const harkat = present(env, "HARKAT_LLM_API_KEY");
  const openai = present(env, "OPENAI_API_KEY");
  if (harkat) {
    list.push({
      id: "harkat",
      tier: "paid",
      key: harkat,
      base: (present(env, "HARKAT_LLM_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: present(env, "HARKAT_LLM_MODEL") || "gpt-4o-mini",
      priceIn: perToken(present(env, "HARKAT_LLM_PRICE_IN") || 0.15),
      priceOut: perToken(present(env, "HARKAT_LLM_PRICE_OUT") || 0.6),
    });
  } else if (openai) {
    list.push({
      id: "openai",
      tier: "paid",
      key: openai,
      base: (present(env, "HARKAT_LLM_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: present(env, "HARKAT_LLM_MODEL") || "gpt-4o-mini",
      priceIn: perToken(present(env, "HARKAT_LLM_PRICE_IN") || 0.15),
      priceOut: perToken(present(env, "HARKAT_LLM_PRICE_OUT") || 0.6),
    });
  }
  const free = list.filter((item) => item.tier === "free");
  const paid = list.filter((item) => item.tier !== "free");
  if (free.length && env.HARKAT_DIRECTOR_ALLOW_PAID !== "1") return free;
  return [...free, ...paid];
}

function messageText(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part?.text || part?.content || "").join("");
  return "";
}

async function postChat(provider, messages, opts) {
  const body = {
    model: provider.model,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 700,
    stream: false,
    messages,
  };
  if (!opts.bare) {
    body.response_format = { type: "json_object" };
    if (provider.reasoning === "none") body.reasoning_effort = "none";
  }
  const fetchImpl = opts.fetchImpl || fetch;
  const res = await fetchImpl(`${provider.base}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 400 && !opts.bare) return postChat(provider, messages, { ...opts, bare: true });
  if (!res.ok) {
    const err = new Error(`provider ${provider.id} http ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const text = messageText(data);
  if (!text.trim()) {
    const err = new Error(`provider ${provider.id} empty`);
    err.status = 502;
    throw err;
  }
  return {
    text,
    provider: provider.id,
    in: Number(data?.usage?.prompt_tokens) || Math.ceil(JSON.stringify(messages).length / 4),
    out: Number(data?.usage?.completion_tokens) || Math.ceil(text.length / 4),
    priceIn: provider.priceIn,
    priceOut: provider.priceOut,
  };
}

/** Try each configured provider. A 4xx/5xx or a timeout moves to the next one. */
export async function completeChat(messages, opts = {}) {
  const providers = opts.providers || configuredProviders();
  if (!providers.length) {
    const err = new Error("no provider");
    err.status = 0;
    throw err;
  }
  let last = null;
  for (const provider of providers) {
    try {
      return await postChat(provider, messages, opts);
    } catch (err) {
      last = err;
    }
  }
  throw last || new Error("no provider");
}
