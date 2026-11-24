import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { planOf } from "@/lib/order";
import { getOrder, isOrderId, saveOrder } from "@/lib/orders";
import { createInvoice, cryptoEnabled } from "@/lib/nowpayments";
import { sameOrigin } from "@/lib/rateLimit";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// Admin-only: creates (or returns the existing) crypto payment link for a confirmed order.
export async function POST(req: Request) {
  if (!(await isAdmin())) return fail("Not found", 404);
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  if (!cryptoEnabled()) return fail("Add the NOWPayments keys in Vercel first.", 400);

  const { id } = (await req.json().catch(() => ({}))) as { id?: unknown };
  if (!isOrderId(id)) return fail("Unknown order", 400);
  const o = await getOrder(id);
  if (!o) return fail("Unknown order", 404);
  if (o.status === "paid") return fail("This order is already paid.", 409);
  if (o.payment?.invoiceUrl) return NextResponse.json({ url: o.payment.invoiceUrl });

  const plan = planOf(o.plan ?? (o as { filmType?: string }).filmType ?? "");
  if (!plan) return fail("This order has no valid plan.", 400);
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const inv = await createInvoice({ orderId: o.id, amount: plan.price, description: `Harkat ${plan.name} film — ${o.productName}`, site });
    await saveOrder({ ...o, payment: { provider: "nowpayments", invoiceId: inv.id, invoiceUrl: inv.url, createdAt: new Date().toISOString() } });
    return NextResponse.json({ url: inv.url });
  } catch (err) {
    console.error("[pay] invoice failed", err);
    return fail("Couldn’t create the payment link. Check the NOWPayments keys.", 502);
  }
}
