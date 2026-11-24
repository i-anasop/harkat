import { NextResponse } from "next/server";
import { normalizeUrl, validate, type Order } from "@/lib/order";
import { saveOrder, type StoredOrder } from "@/lib/orders";
import { payToken } from "@/lib/payToken";
import { verifyHuman } from "@/lib/altcha";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rateLimit";
import { TERMS_VERSION } from "@/lib/legal";
import { screenText } from "@harkat/engine";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// Orders are saved and shown in /admin. Layers: same-origin check, size cap, per-IP rate
// limit (after the robot check), honeypot, proof-of-work "not a robot" check, then strict validation.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  if (Number(req.headers.get("content-length") ?? 0) > 16_000) return fail("Request too large", 413);

  let data: Partial<Order> & { company?: string; altcha?: unknown; acceptTerms?: unknown; pledge?: unknown };
  try {
    data = await req.json();
  } catch {
    return fail("Invalid request", 400);
  }
  // Honeypot: bots fill the hidden "company" field.
  if (data.company) return NextResponse.json({ ok: true, id: "ok" });
  if (data.pledge !== true) return fail("Please confirm you won’t add music or anything impermissible.", 400);
  if (data.acceptTerms !== true) return fail("Please accept the Terms of service.", 400);
  if (!(await verifyHuman(data.altcha))) return fail("Please confirm you’re not a robot.", 403);
  // Counted after the robot check, so failed attempts don’t use up a real visitor’s tries.
  if (!rateLimit(`order:${clientIp(req)}`, 5, 10 * 60_000)) return fail("Too many orders from this network. Please try again later.", 429);

  const errors = validate(data);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  const screened = screenText(
    [data.productName, data.productUrl, data.pitch, data.notes, data.productType, data.purpose, data.referenceUrl]
      .filter((v) => typeof v === "string")
      .join("\n"),
  );
  if (!screened.ok) return fail(screened.reason, 422);

  const clean = (v?: string) => v?.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") || undefined;
  const id = `${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
  let order: StoredOrder;
  try {
    order = {
      id,
      createdAt: new Date().toISOString(),
      status: "awaiting-payment",
      termsAccepted: TERMS_VERSION,
      pledge: true,
      plan: data.plan!,
      productName: clean(data.productName)!,
      productUrl: normalizeUrl(data.productUrl!),
      ratio: data.ratio!,
      productType: data.productType || undefined,
      purpose: data.purpose || undefined,
      pitch: clean(data.pitch),
      style: typeof data.style === "string" && /^[a-z0-9-]{1,40}$/.test(data.style) ? data.style : undefined,
      referenceUrl: data.referenceUrl ? normalizeUrl(data.referenceUrl) : undefined,
      colors: data.colors?.length ? data.colors.map((c) => c.toUpperCase()) : undefined,
      deadline: data.deadline!,
      name: clean(data.name)!,
      email: clean(data.email)!,
      notes: clean(data.notes),
    };
    await saveOrder(order);
  } catch (err) {
    console.error("[order] save failed", err);
    return fail("Could not save your order. Please email us instead.", 500);
  }

  // The pay box uses this token to open the checkout for this order only.
  return NextResponse.json({ ok: true, id, payToken: payToken(order.id) });
}
