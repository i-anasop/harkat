// Admin access is a secret key (ADMIN_KEY env). Visiting /admin?key=<ADMIN_KEY> once sets a
// cookie holding an HMAC of the key; without it /admin is a plain 404. Changing the key logs everyone out.
// Web Crypto, so it runs in the proxy and in server components alike.
export const ADMIN_COOKIE = "harkat_admin";

export async function adminToken(): Promise<string | null> {
  const key = process.env.ADMIN_KEY;
  return key && key.length >= 24 ? tokenFor(key) : null;
}

export async function tokenFor(key: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("harkat-admin-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string compare.
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
