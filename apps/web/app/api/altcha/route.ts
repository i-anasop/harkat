import { NextResponse } from "next/server";
import { altcha, altchaReady } from "@/lib/altcha";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Issues a fresh proof-of-work challenge for the order form.
export async function GET(req: Request) {
  if (!altchaReady) return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
  if (!rateLimit(`ch:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  return altcha.challengeHandler(req);
}
