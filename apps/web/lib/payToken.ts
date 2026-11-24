import "server-only";
import crypto from "crypto";

// A per-order token so only the person who placed an order can open its checkout.
const key = () => `${process.env.ALTCHA_HMAC_KEY ?? ""}:harkat-pay`;

export const payToken = (orderId: string) => crypto.createHmac("sha256", key()).update(orderId).digest("base64url").slice(0, 32);

export function checkPayToken(orderId: string, token: unknown) {
  if (typeof token !== "string" || token.length !== 32 || !process.env.ALTCHA_HMAC_KEY) return false;
  return crypto.timingSafeEqual(Buffer.from(payToken(orderId)), Buffer.from(token));
}
