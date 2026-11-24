import "server-only";
import { create, randomInt, CappedMap } from "altcha-lib/frameworks/nextjs";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

// Self-hosted "I'm not a robot": the browser solves a small proof-of-work puzzle
// (about a second on a phone), signed with ALTCHA_HMAC_KEY. No third party, no tracking.
const secret = process.env.ALTCHA_HMAC_KEY;

// Each solved puzzle can be used once (per server instance).
const used = new CappedMap<string, boolean>({ maxSize: 10_000 });

export const altcha = create({
  deriveKey,
  hmacSignatureSecret: secret,
  store: used,
  createChallengeParameters: () => ({
    algorithm: "PBKDF2/SHA-256",
    cost: 500,
    counter: randomInt(800, 2_500),
    expiresAt: new Date(Date.now() + 15 * 60_000),
  }),
});

export const altchaReady = !!secret && secret.length >= 24;

export async function verifyHuman(payload: unknown) {
  if (!altchaReady || typeof payload !== "string" || payload.length > 4_000) return false;
  const { error } = await altcha.verify(payload, deriveKey, secret, undefined, used);
  return !error;
}
