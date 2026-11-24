import { NextResponse } from "next/server";

// Fetches a site's icon for the order preview through our own server, so the visitor's
// browser never talks to a third party. 404 when there's no real icon (client shows initials).
export async function GET(req: Request) {
  const d = new URL(req.url).searchParams.get("d")?.toLowerCase() ?? "";
  if (!/^(?=.{4,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/.test(d)) return new NextResponse(null, { status: 400 });
  try {
    const r = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`, { next: { revalidate: 86400 } });
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !type.startsWith("image/")) return new NextResponse(null, { status: 404 });
    const body = await r.arrayBuffer();
    if (body.byteLength > 200_000) return new NextResponse(null, { status: 404 });
    return new NextResponse(body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
