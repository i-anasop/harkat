import { NextResponse } from "next/server";
import { getOrder, isOrderId } from "@/lib/orders";
import { checkPayToken } from "@/lib/payToken";

// Polled by the pay box. The IPN webhook marks the order paid; this just reports it.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  if (!isOrderId(id) || !checkPayToken(id, u.searchParams.get("token"))) return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  const o = await getOrder(id);
  if (!o) return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  return NextResponse.json({ paid: o.status === "paid", status: o.payment?.status ?? "waiting" }, { headers: { "Cache-Control": "no-store" } });
}
