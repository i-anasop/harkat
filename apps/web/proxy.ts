import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken, safeEqual, tokenFor } from "@/lib/adminToken";

// Hides the admin area: anyone without the key or session cookie gets a normal 404.
export async function proxy(req: NextRequest) {
  const token = await adminToken();
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  const notFound = () =>
    isApi ? NextResponse.json({ error: "Not found" }, { status: 404 }) : NextResponse.rewrite(new URL("/_not-found", req.url), { status: 404 });

  if (!token) return notFound();

  const key = req.nextUrl.searchParams.get("key");
  if (key !== null) {
    if (!key || !safeEqual(await tokenFor(key), token)) return notFound();
    // Valid key: set the session cookie and drop the key from the address bar.
    const res = NextResponse.redirect(new URL("/admin", req.url));
    res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  const c = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!c || !safeEqual(c, token)) return notFound();
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = { matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"] };
