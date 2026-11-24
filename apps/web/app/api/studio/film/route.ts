import { NextResponse } from "next/server";
import { compose } from "@harkat/engine";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, reason: "Forbidden" }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > 200_000) {
    return NextResponse.json({ ok: false, reason: "That logo is too big. Use a file under 80 KB." }, { status: 413 });
  }
  if (!rateLimit(`studio:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ ok: false, reason: "Too many previews from this network. Please wait a few minutes." }, { status: 429 });
  }

  let body: { name?: string; problem?: string; features?: unknown; accent?: string; url?: string; logo?: string; template?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "That brief could not be read." }, { status: 400 });
  }

  const features = Array.isArray(body.features) ? body.features.filter((f): f is string => typeof f === "string") : [];
  const allowed = ["launch", "holo", "workflow", "auto"] as const;
  const template = allowed.find((item) => item === body.template) ?? "auto";
  const made = compose(
    { name: body.name, problem: body.problem, features, accent: body.accent, url: body.url, logo: body.logo, sample: true, template },
    { fontUrl: "/fonts/Geist-Variable.woff2" },
  );
  if (!made.ok) return NextResponse.json(made, { status: 422 });
  return NextResponse.json({ ok: true, html: made.html, duration: made.duration, events: made.events });
}
