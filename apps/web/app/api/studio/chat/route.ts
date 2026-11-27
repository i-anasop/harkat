import { configuredProviders } from "@harkat/engine";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rateLimit";
import { CHAT_SYSTEM, isSmallTalk, parseModelReply, replyWithoutModel } from "@/lib/studioChat.mjs";

export const maxDuration = 30;

const usage = { day: "", global: 0, ips: new Map<string, number>() };

function allowChat(ip: string) {
  const day = new Date().toISOString().slice(0, 10);
  if (usage.day !== day) {
    usage.day = day;
    usage.global = 0;
    usage.ips = new Map();
  }
  const capIp = Number(process.env.HARKAT_DIRECTOR_IP_DAY || 8);
  const capAll = Number(process.env.HARKAT_DIRECTOR_GLOBAL_DAY || 40);
  const key = String(ip || "local").slice(0, 80);
  const count = usage.ips.get(key) || 0;
  if (count >= capIp || usage.global >= capAll) return false;
  usage.ips.set(key, count + 1);
  usage.global += 1;
  return true;
}

function cleanPlan(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as { title?: unknown; beats?: unknown; length?: unknown; colours?: unknown };
  const beats = Array.isArray(raw.beats) ? raw.beats.map((beat) => String(beat).trim()).filter(Boolean).slice(0, 6) : [];
  if (!beats.length) return undefined;
  const length = raw.length === 15 || raw.length === 30 || raw.length === 45 ? raw.length : 15;
  const colours = typeof raw.colours === "string" && /^#[0-9A-Fa-f]{6}$/.test(raw.colours) ? raw.colours : "";
  return { title: String(raw.title || "Film").slice(0, 48), beats, length, colours };
}

function cleanMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  const out: { role: "user" | "assistant"; text: string; plan?: ReturnType<typeof cleanPlan> }[] = [];
  for (const item of value.slice(-12)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role === "assistant" ? "assistant" : "user";
    const text = String((item as { text?: string }).text || "").replace(/\s+/g, " ").trim().slice(0, 800);
    if (!text) continue;
    const plan = role === "assistant" ? cleanPlan((item as { plan?: unknown }).plan) : undefined;
    out.push(plan ? { role, text, plan } : { role, text });
  }
  return out;
}

async function streamProvider(provider: { id: string; key: string; base: string; model: string; headers?: Record<string, string> }, messages: { role: string; content: string }[]) {
  const res = await fetch(`${provider.base}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify({ model: provider.model, temperature: 0.4, max_tokens: 420, stream: true, messages }),
  });
  if (!res.ok || !res.body) throw new Error(`chat ${provider.id} ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const data = line.trim().replace(/^data:\s*/, "");
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string") full += delta;
      } catch { /* a partial SSE line */ }
    }
  }
  if (!full.trim()) throw new Error(`chat ${provider.id} empty`);
  return full;
}

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(sse({ done: true, kind: "talk", text: "That request was blocked." }), { status: 403, headers: { "Content-Type": "text/event-stream" } });
  if (!rateLimit(`chat:${clientIp(req)}`, 24, 10 * 60_000)) {
    return new Response(sse({ done: true, kind: "talk", text: "Too many messages from this network. Wait a few minutes." }), { status: 429, headers: { "Content-Type": "text/event-stream" } });
  }

  let body: { messages?: unknown; url?: string; length?: number; colours?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(sse({ done: true, kind: "talk", text: "I couldn’t read that." }), { status: 400, headers: { "Content-Type": "text/event-stream" } });
  }

  const messages = cleanMessages(body.messages);
  const opts = { url: typeof body.url === "string" ? body.url.slice(0, 200) : "", length: body.length, colours: typeof body.colours === "string" ? body.colours : "" };
  const rules = replyWithoutModel(messages, opts);
  const providers = configuredProviders();
  const ip = clientIp(req);
  let result = rules;
  let source = "rules";

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (providers.length && rules.kind !== "decline" && allowChat(ip)) {
    const history = messages.map((m) => ({
      role: m.role,
      content: m.plan ? `${m.text}\nPlan: ${JSON.stringify(m.plan)}` : m.text,
    }));
    for (const provider of providers) {
      try {
        const hint = [
          opts.url ? `Website: ${opts.url}` : "",
          opts.colours ? `Use this site colour when you plan: ${opts.colours}` : "",
          `Preferred length if they do not name one: ${opts.length || 15}`,
        ].filter(Boolean).join(" ");
        const full = await streamProvider(provider, [{ role: "system", content: `${CHAT_SYSTEM} ${hint}` }, ...history]);
        const parsed = parseModelReply(full);
        if (!parsed.text) continue;
        const greetingPlan = parsed.kind === "plan" && rules.kind === "talk" && lastUser && isSmallTalk(lastUser.text);
        result = greetingPlan
          ? rules
          : { kind: parsed.kind, text: parsed.text, plan: parsed.plan || undefined };
        source = greetingPlan ? "rules" : provider.id;
        break;
      } catch {
        console.info(`harkat chat provider=${provider.id} failed`);
        source = "rules";
        result = rules;
      }
    }
  } else if (providers.length && rules.kind !== "decline") {
    console.info("harkat chat source=rules reason=quota");
  }

  console.info(`harkat chat source=${source} kind=${result.kind}`);

  const encoder = new TextEncoder();
  const text = result.text || "";
  const pieces = text.split(/(\s+)/).filter((part) => part.length);
  const stream = new ReadableStream({
    async start(controller) {
      for (const part of pieces) {
        controller.enqueue(encoder.encode(sse({ t: part })));
        await new Promise((resolve) => setTimeout(resolve, 18));
      }
      controller.enqueue(encoder.encode(sse({ done: true, kind: result.kind, plan: result.plan || null })));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
