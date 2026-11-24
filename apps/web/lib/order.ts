// Plans and order validation. Shared by the order flow, the API and the admin panel.
// Prices, lengths, perks and delivery times live here — edit them in one place.
export const PLANS = [
  {
    key: "spark", name: "Spark", price: 30, length: "10–20s", delivery: "3 days",
    blurb: "A sharp teaser for a feature or an update.",
    perks: ["Your logo, colours and real UI", "Sound design — effects only", "1 round of revisions"],
  },
  {
    key: "launch", name: "Launch", price: 50, length: "20–40s", delivery: "4 days",
    blurb: "The full launch film, ready for every feed.",
    perks: ["Your product UI, animated", "Custom sound effects mix", "2 rounds of revisions"],
    popular: true,
  },
  {
    key: "studio", name: "Studio", price: 100, length: "30–60s", delivery: "5 days · priority",
    blurb: "A flagship film, crafted end to end.",
    perks: ["Script and storyboard help", "Premium motion + custom SFX", "4 rounds of revisions"],
  },
] as const;

// Tap-to-choose answers in the order flow.
export const PRODUCT_TYPES = ["AI tool", "SaaS / web app", "Mobile app", "Developer tool", "Something else"] as const;
export const PURPOSES = ["Product launch", "New feature", "Explainer", "Social ad"] as const;
// One film, one aspect ratio — the client picks it.
export const RATIOS = [["16:9", "Landscape"], ["9:16", "Vertical"]] as const;
export type Ratio = (typeof RATIOS)[number][0];

export type PlanKey = (typeof PLANS)[number]["key"];
export const planOf = (k: string) => PLANS.find((p) => p.key === k);

export type Order = {
  plan: PlanKey;
  productName: string;
  productUrl: string;
  productType?: string;
  purpose?: string;
  pitch?: string;
  ratio: Ratio;
  style?: string; // slug of a Harkat film the client likes
  referenceUrl?: string;
  colors?: string[]; // hex, up to 4
  deadline: string; // YYYY-MM-DD
  name: string;
  email: string;
  notes?: string;
};

// Max lengths, enforced on the server.
export const LIMITS = { productName: 80, productUrl: 300, pitch: 200, referenceUrl: 300, name: 100, email: 200, notes: 1500 } as const;

const isUrl = (v: string) => {
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return (u.protocol === "https:" || u.protocol === "http:") && /\.[a-z]{2,}$/i.test(u.hostname);
  } catch {
    return false;
  }
};

export const normalizeUrl = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`);
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

// Returns an error message per invalid field (empty object = valid).
export function validate(o: Partial<Order>): Partial<Record<keyof Order, string>> {
  const e: Partial<Record<keyof Order, string>> = {};
  const long = (k: keyof typeof LIMITS) => typeof o[k] === "string" && (o[k] as string).length > LIMITS[k];
  if (!planOf(o.plan ?? "")) e.plan = "Pick a plan";
  if (!o.productName?.trim()) e.productName = "Tell us what it’s called";
  else if (long("productName")) e.productName = "That’s a bit long";
  if (!o.productUrl || !isUrl(o.productUrl) || long("productUrl")) e.productUrl = "Enter a valid link, e.g. yourproduct.com";
  if (long("pitch")) e.pitch = "Keep it to one line";
  if (!RATIOS.some(([r]) => r === o.ratio)) e.ratio = "Pick a format";
  if (o.productType && !(PRODUCT_TYPES as readonly string[]).includes(o.productType)) e.productType = "Pick one of the options";
  if (o.purpose && !(PURPOSES as readonly string[]).includes(o.purpose)) e.purpose = "Pick one of the options";
  if (o.referenceUrl && (!isUrl(o.referenceUrl) || long("referenceUrl"))) e.referenceUrl = "Enter a valid link or skip";
  if (o.colors && (!Array.isArray(o.colors) || o.colors.length > 4 || o.colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c)))) e.colors = "Invalid colours";
  if (!o.deadline || !isDate(o.deadline)) e.deadline = "Pick a deadline";
  if (!o.name || o.name.trim().length < 2) e.name = "Enter your name";
  else if (long("name")) e.name = "That’s a bit long";
  if (!o.email || !isEmail(o.email) || long("email")) e.email = "Enter a valid email";
  if (long("notes")) e.notes = "Please keep notes under 1,500 characters";
  return e;
}
