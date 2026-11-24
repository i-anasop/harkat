import "server-only";
import crypto from "crypto";

// Crypto checkout via NOWPayments. Funds settle straight to our own wallet; NOWPayments
// calls /api/pay/ipn when a payment changes state, and that marks the order paid.
const API = "https://api.nowpayments.io/v1";

export const cryptoEnabled = () => !!process.env.NOWPAYMENTS_API_KEY && !!process.env.NOWPAYMENTS_IPN_SECRET;

// embed: shown in NOWPayments’ widget inside our pay box, so no redirect URLs. It is locked to
// USDC on Base — our payout wallet — so there is no conversion and no coin picker.
export async function createInvoice(o: { orderId: string; amount: number; description: string; site: string; embed?: boolean }) {
  const res = await fetch(`${API}/invoice`, {
    method: "POST",
    headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: o.amount,
      price_currency: "usd",
      order_id: o.orderId,
      order_description: o.description,
      ipn_callback_url: `${o.site}/api/pay/ipn`,
      ...(o.embed ? { pay_currency: "usdcbase" } : { success_url: `${o.site}/paid`, cancel_url: o.site }),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NOWPayments ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as { id: string | number; invoice_url: string };
  return { id: String(j.id), url: j.invoice_url };
}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
const sortDeep = (v: Json): Json =>
  Array.isArray(v) ? v.map(sortDeep) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortDeep(v[k])])) : v;

// The signature is HMAC-SHA512 (IPN secret) over the key-sorted JSON body, sent in x-nowpayments-sig.
// NOWPayments' own examples disagree on nested sorting, so either serialisation is accepted.
export function verifyIpn(body: { [k: string]: Json }, sig: string | null) {
  if (!sig || !process.env.NOWPAYMENTS_IPN_SECRET) return false;
  const given = Buffer.from(sig.toLowerCase());
  return [JSON.stringify(sortDeep(body)), JSON.stringify(body, Object.keys(body).sort())].some((s) => {
    const mac = Buffer.from(crypto.createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET!).update(s).digest("hex"));
    return mac.length === given.length && crypto.timingSafeEqual(mac, given);
  });
}
