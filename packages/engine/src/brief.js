import { screenText } from "./halal.js";

const clean = (value, max) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function hostnameOf(url) {
  const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const u = new URL(withProto);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
  return u.hostname.replace(/^www\./i, "");
}

function logoBody(logo) {
  const comma = logo.indexOf(",");
  const body = comma >= 0 ? logo.slice(comma + 1) : logo;
  try {
    return decodeURIComponent(body);
  } catch {
    return body;
  }
}

function checkLogo(logo) {
  if (typeof logo !== "string" || logo.length < 20) return { ok: true, logo: null };
  if (logo.length > 120_000) return { ok: false, reason: "That logo file is too big. Use an SVG or PNG under 80 KB." };
  const ok =
    logo.startsWith("data:image/png") ||
    logo.startsWith("data:image/jpeg") ||
    logo.startsWith("data:image/webp") ||
    logo.startsWith("data:image/svg+xml") ||
    logo.startsWith("data:image/gif");
  if (!ok) return { ok: false, reason: "Use a PNG, JPG, WEBP or SVG logo." };
  const raw = `${logo}\n${logoBody(logo)}`;
  if (/<script|javascript:|foreignObject|<iframe|<embed|<object|on\w+\s*=/i.test(raw)) {
    return { ok: false, reason: "That logo file isn’t a plain image. Export a clean SVG or PNG." };
  }
  return { ok: true, logo };
}

function goalOf(input) {
  if (["launch", "feature", "explainer"].includes(input.goal)) return input.goal;
  if (input.template === "workflow") return "feature";
  if (input.template === "holo") return "explainer";
  if (input.template === "launch") return "launch";
  return "launch";
}

/**
 * Turn a form into a brief, or a plain reason we can't.
 * Halal check runs on the name, line, features, proof and link together.
 */
export function readBrief(input) {
  if (!input || typeof input !== "object") return { ok: false, reason: "Tell us about the product." };
  const name = clean(input.name, 48);
  const problem = clean(input.problem || input.oneLiner, 180);
  const features = (Array.isArray(input.features) ? input.features : [])
    .map((f) => clean(f, 72))
    .filter(Boolean)
    .slice(0, 4);
  const url = clean(input.url, 200);
  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent || "") ? input.accent.toUpperCase() : "#2E4BDB";
  const audience = clean(input.audience, 48);
  const proof = clean(input.proof, 32);
  const length = [15, 30, 45].includes(Number(input.length)) ? Number(input.length) : 30;
  const tone = ["quiet", "plain", "bold"].includes(input.tone) ? input.tone : "plain";
  const goal = goalOf(input);

  if (name.length < 2) return { ok: false, reason: "Add the product name." };
  if (problem.length < 8) return { ok: false, reason: "Add the problem in one line." };
  if (!features.length) return { ok: false, reason: "Add at least one thing the product does." };

  let hostname = "";
  try {
    hostname = hostnameOf(url);
  } catch {
    return { ok: false, reason: "Add a real product link, like northstar.example." };
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) {
    return { ok: false, reason: "Add a real product link, like northstar.example." };
  }

  const screened = screenText([name, problem, features.join("\n"), audience, proof, url, hostname].join("\n"));
  if (!screened.ok) return screened;

  const logoCheck = checkLogo(input.logo);
  if (!logoCheck.ok) return logoCheck;

  return {
    ok: true,
    brief: {
      name,
      problem,
      features,
      url,
      hostname,
      accent,
      logo: logoCheck.logo,
      sample: input.sample !== false,
      audience,
      proof,
      goal,
      tone,
      length,
      template: goal,
    },
  };
}
