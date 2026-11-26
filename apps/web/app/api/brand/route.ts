import { NextResponse } from "next/server";
import { extractSite, fetchPublicPage } from "@harkat/engine";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const HOST = /^(?=.{4,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/;

// Colour (and name) from a public site, for the prompt chip. The favicon is a separate route.
export async function GET(req: Request) {
  if (!rateLimit(`brand:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const d = new URL(req.url).searchParams.get("d")?.toLowerCase() ?? "";
  if (!HOST.test(d)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const page = await fetchPublicPage(`https://${d}`, { timeout: 2500, maxBytes: 400_000 });
    const site = extractSite(page.html, page.url);
    const color = /^#[0-9A-Fa-f]{6}$/.test(site.color ?? "") ? site.color : null;
    return NextResponse.json({ ok: true, color, name: site.name || "" });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
