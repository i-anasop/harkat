import { NextResponse } from "next/server";
import { planOf } from "@/lib/order";
import { getOrder, isOrderId, saveOrder } from "@/lib/orders";
import { createInvoice, cryptoEnabled } from "@/lib/nowpayments";
import { checkPayToken } from "@/lib/payToken";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rateLimit";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// Opens NOWPayments' checkout for an order placed in this browser (reused if one exists).
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  if (!cryptoEnabled()) return fail("Crypto checkout isn’t available right now.", 503);
  const { id, token } = (await req.json().catch(() => ({}))) as { id?: unknown; token?: unknown };
  if (!isOrderId(id) || !checkPayToken(id, token)) return fail("Unknown order", 404);
  if (!rateLimit(`pay:${clientIp(req)}`, 12, 10 * 60_000)) return fail("Too many attempts. Please wait a few minutes.", 429);

  const o = await getOrder(id);
  if (!o) return fail("Unknown order", 404);
  if (o.status === "paid") return NextResponse.json({ paid: true });
  if (o.payment?.invoiceId) return NextResponse.json({ iid: o.payment.invoiceId });

  const plan = planOf(o.plan)!;
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const inv = await createInvoice({ orderId: o.id, amount: plan.price, description: `Harkat ${plan.name} film — ${o.productName}`, site, embed: true });
    await saveOrder({ ...o, payment: { provider: "nowpayments", createdAt: new Date().toISOString(), invoiceId: inv.id, invoiceUrl: inv.url } });
    return NextResponse.json({ iid: inv.id });
  } catch (err) {
    console.error("[pay] invoice failed", err);
    return fail("We couldn’t open the checkout. Please try again, or email us.", 502);
  }
}
