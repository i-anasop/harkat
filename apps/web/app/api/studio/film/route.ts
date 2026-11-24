import { NextResponse } from "next/server";
import { composeWithModel, extractSite, fetchImageData, fetchPublicPage } from "@harkat/engine";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rateLimit";

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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "That brief could not be read." }, { status: 400 });
  }

  const features = Array.isArray(body.features) ? body.features.filter((f): f is string => typeof f === "string") : [];
  let name = body.name;
  let problem = body.problem || body.oneLiner;
  let accent = body.accent;
  let logo = body.logo;
  let siteText = "";
  if (body.url && body.personalize !== false) {
    try {
      const page = await fetchPublicPage(withProto(body.url));
      const site = extractSite(page.html, page.url);
      siteText = `${site.name} ${site.tagline}`.trim();
      if (!name && site.name) name = site.name;
      if (!problem && site.tagline) problem = site.tagline;
      if (!body.accentSet && site.color) accent = site.color;
      if (!logo && site.logoHref) {
        try {
          logo = (await fetchImageData(site.logoHref)) ?? undefined;
        } catch { /* a missing logo should not block the preview */ }
      }
      if (!logo && site.logoSvg) logo = `data:image/svg+xml,${encodeURIComponent(site.logoSvg)}`;
    } catch { /* keep the brief the person typed */ }
  }

  const goals = ["launch", "feature", "explainer"] as const;
  const tones = ["quiet", "plain", "bold"] as const;
  const lengths = [15, 30, 45] as const;
  const made = await composeWithModel(
    {
      name,
      problem,
      features,
      accent,
      url: body.url,
      logo,
      sample: true,
      audience: body.audience,
      proof: body.proof,
      goal: goals.find((item) => item === body.goal) ?? "launch",
      tone: tones.find((item) => item === body.tone) ?? "plain",
      length: lengths.find((item) => item === Number(body.length)) ?? 30,
    },
    { fontUrl: "/fonts/Geist-Variable.woff2", siteText },
  );
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
  });
}
