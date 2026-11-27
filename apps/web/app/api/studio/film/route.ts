import { NextResponse } from "next/server";
import { briefFromPrompt, composeWithModel, extractSite, fetchImageData, fetchPublicPage } from "@harkat/engine";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rateLimit";

export const maxDuration = 30;

function withProto(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, reason: "Forbidden" }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > 200_000) {
    return NextResponse.json({ ok: false, reason: "That logo is too big. Use a file under 80 KB." }, { status: 413 });
  }
  if (!rateLimit(`studio:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ ok: false, reason: "Too many previews from this network. Please wait a few minutes." }, { status: 429 });
  }

  let body: {
    name?: string;
    problem?: string;
    oneLiner?: string;
    features?: unknown;
    accent?: string;
    accentSet?: boolean;
    url?: string;
    logo?: string;
    goal?: string;
    tone?: string;
    length?: number;
    audience?: string;
    proof?: string;
    personalize?: boolean;
    prompt?: string;
    seed?: string | number;
    frame?: string;
    plan?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "That brief could not be read." }, { status: 400 });
  }

  let features = Array.isArray(body.features) ? body.features.filter((f): f is string => typeof f === "string") : [];
  let name = body.name;
  let problem = body.problem || body.oneLiner;
  let url = typeof body.url === "string" ? body.url : "";
  let personalize = body.personalize !== false;
  let invented = false;
  if (typeof body.prompt === "string" && body.prompt.trim()) {
    const parsed = briefFromPrompt(body.prompt, url);
    if (!parsed.ok) return NextResponse.json(parsed, { status: 422 });
    if (!name) name = parsed.name;
    if (!problem) problem = parsed.problem;
    if (!features.length) features = parsed.features;
    if (!url) url = parsed.url;
    invented = parsed.inventedHost;
    if (invented) personalize = false;
  }
  let accent = body.accent;
  let logo = body.logo;
  let siteText = "";
  let brandFont = "";
  let note = invented ? "No website yet, so the end card uses a stand-in address." : "";
  if (url && personalize) {
    try {
      const page = await fetchPublicPage(withProto(url), { timeout: 3000, maxBytes: 700_000 });
      const site = extractSite(page.html, page.url);
      siteText = [site.name, site.tagline, site.excerpt].filter(Boolean).join("\n").slice(0, 1200);
      brandFont = site.font || "";
      if (!name && site.name) name = site.name;
      if (!problem && site.tagline) problem = site.tagline;
      if (!body.accentSet && site.color) accent = site.color;
      if (!logo && site.logoHref) {
        try {
          logo = (await fetchImageData(site.logoHref)) ?? undefined;
        } catch { /* a missing logo should not block the preview */ }
      }
      if (!logo && site.logoSvg) logo = `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`;
    } catch {
      note = "We couldn’t read that site from here, so this preview uses what you typed.";
    }
  }
  if (!features.length && problem) features = [problem];
  const given = body.plan && typeof body.plan === "object"
    ? body.plan as { title?: string; beats?: unknown; length?: number; colours?: string; shots?: unknown }
    : undefined;
  const planBeats = Array.isArray(given?.beats) ? given.beats.filter((b): b is string => typeof b === "string" && b.trim().length > 0).slice(0, 6) : [];
  if (planBeats.length) {
    if (given?.title?.trim()) name = given.title.trim().slice(0, 48);
    problem = planBeats[0];
    features = planBeats.slice(0, 4);
    const colour = given?.colours || "";
    if (/^#[0-9A-Fa-f]{6}$/.test(colour)) accent = colour;
    siteText = [siteText, "Shot plan the director should follow:", ...planBeats.map((beat, i) => `${i + 1}. ${beat}`)].filter(Boolean).join("\n").slice(0, 1200);
  }

  const goals = ["launch", "feature", "explainer"] as const;
  const tones = ["quiet", "plain", "bold"] as const;
  const lengths = [15, 30, 45] as const;
  let made;
  try {
    made = await composeWithModel(
    {
      name,
      problem,
      features,
      accent,
      url,
      logo,
      sample: true,
      audience: body.audience,
      proof: body.proof,
      goal: goals.find((item) => item === body.goal) ?? "launch",
      tone: tones.find((item) => item === body.tone) ?? "plain",
      length: lengths.find((item) => item === Number(given?.length)) ?? lengths.find((item) => item === Number(body.length)) ?? 30,
    },
    {
      fontUrl: "/fonts/Geist-Variable.woff2",
      siteText,
      brandFont,
      timeout: Number(process.env.HARKAT_DIRECTOR_BUDGET_MS) || 9000,
      seed: body.seed,
      ip: clientIp(req),
      frame: body.frame === "portrait" ? "portrait" : "landscape",
      plan: given && Array.isArray(given.shots) ? given : undefined,
    },
  );
  } catch {
    return NextResponse.json({ ok: false, reason: "The preview couldn’t be made just now. You can still order the film." }, { status: 500 });
  }
  if (!made.ok) return NextResponse.json(made, { status: 422 });
  return NextResponse.json({
    ok: true,
    html: made.html,
    duration: made.duration,
    events: made.events,
    goal: made.goal,
    length: made.length,
    accent: made.accent,
    planSource: made.planSource,
    planCost: made.planCost,
    planNote: made.planNote || "",
    name: name || "",
    note,
  });
}
