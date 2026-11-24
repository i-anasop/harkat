import "server-only";
import { planOf } from "./order";
import { saveOrder, type StoredOrder } from "./orders";

type Update = { payment_status?: unknown; price_amount?: unknown; price_currency?: unknown; pay_currency?: unknown; actually_paid?: unknown };

// Records a NOWPayments status on the order. Only a "finished" payment of at least the plan
// price in USD marks it paid. Shared by the IPN webhook and the pay box's status check.
export async function settle(o: StoredOrder, u: Update) {
  const status = String(u.payment_status ?? "");
  const price = planOf(o.plan ?? (o as { filmType?: string }).filmType ?? "")?.price ?? Infinity;
  const paid = status === "finished" && String(u.price_currency).toLowerCase() === "usd" && Number(u.price_amount) >= price;
  if (o.status === "paid" || (!paid && o.payment?.status === status)) return o.status === "paid";

  await saveOrder({
    ...o,
    ...(paid ? { status: "paid" as const } : {}),
    payment: {
      ...(o.payment ?? { provider: "nowpayments", createdAt: new Date().toISOString() }),
      status,
      ...(paid ? { paidAt: new Date().toISOString(), payCurrency: String(u.pay_currency ?? "").toUpperCase(), paidAmount: Number(u.actually_paid) || undefined } : {}),
    },
  });
  return paid;
}
