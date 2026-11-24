import { applyFill } from "./direct.js";

/**
 * Optional. A model may only shorten words that are already in the brief.
 * If there is no key, or the reply is unusable, the rule director stands.
 * This never asks a model to write animation code.
 */
export async function withOptionalModel(brief) {
  const groq = process.env.GROQ_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  const key = groq || openai;
  if (!key) return brief;

  const url = groq
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = process.env.HARKAT_LLM_MODEL || (groq ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

  const body = {
    model,
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You shorten on-screen words for a product film. Use ONLY words from the brief. Do not add numbers, customers, reviews or results. Do not mention music. Reply with JSON only: {\"hook\":\"max 12 words\",\"swaps\":[\"2 to 4 words\"]}.",
      },
      {
        role: "user",
        content: JSON.stringify({
          name: brief.name,
          problem: brief.problem,
          features: brief.features,
        }),
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return brief;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return applyFill(brief, json);
  } catch {
    return brief;
  }
}
