import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { verifyIpn } from "@/lib/nowpayments";
import { settle } from "@/lib/settle";

// NOWPayments calls this whenever a payment changes state (signed with our IPN secret).
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 20_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: Record<string, never>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !verifyIpn(body, req.headers.get("x-nowpayments-sig"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const b = body as Record<string, unknown>;
  const o = await getOrder(String(b.order_id ?? ""));
  if (!o?.payment) return NextResponse.json({ ok: true }); // not ours; acknowledge so it isn't retried
  if (b.invoice_id != null && o.payment.invoiceId && String(b.invoice_id) !== o.payment.invoiceId) return NextResponse.json({ ok: true });

  await settle(o, b);
  return NextResponse.json({ ok: true });
}
