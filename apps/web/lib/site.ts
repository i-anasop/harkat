// Single place for links, contact details and feature flags.

// Pond films stay private until Dylan (Pond CEO) approves. Flip in env, not code.
export const SHOW_POND_WORK = process.env.NEXT_PUBLIC_SHOW_POND_WORK === "true";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const CONTACT_EMAIL = "reach.harkat@gmail.com";
export const X_URL = "https://x.com/harkatai";
export const LINKEDIN_URL = "https://www.linkedin.com/company/harkatai";

export type Film = {
  slug: string;
  title: string;
  short: string; // label in the home film bar
  kind: string;
  about: string; // one line for the home films section
  duration: string; // m:ss
  tags: ("launch" | "product" | "announcement")[];
  // The film whose style this one references, credited on the site. Leave out until confirmed.
  credit?: { label: string; url: string };
};

// Order follows the designs. Files live in /public/films/<slug>.{mp4,jpg} and <slug>-loop.mp4.
export const FILMS: Film[] = [
  { slug: "pond-for-ai-agents", title: "Introducing Pond for AI Agents", short: "Pond for AI Agents", kind: "Launch film", about: "The launch of Pond’s AI agents: find leads, build agents and automate the busywork.", duration: "0:39", tags: ["launch", "announcement"], credit: { label: "@motionstashco", url: "https://x.com/motionstashco/status/2112973221750354092?s=20" } },
  { slug: "meet-pond-ai", title: "Meet Pond AI", short: "Meet Pond AI", kind: "Brand film", about: "A short brand film that introduces Pond AI and what it does.", duration: "0:38", tags: ["announcement"] },
  { slug: "pond-bot-launch", title: "Pond Bot launch", short: "Pond Bot launch", kind: "Product launch", about: "Launching Pond Bot, which suggests AI agent ideas tailored to your business.", duration: "0:31", tags: ["launch", "product"] },
  { slug: "whatsapp-booking-agent", title: "WhatsApp booking agent", short: "Booking agent", kind: "Use-case film", about: "An AI agent that books appointments right inside WhatsApp, start to finish.", duration: "0:33", tags: ["product"] },
];

export const filmSrc = (slug: string) => `/films/${slug}.mp4`;
export const filmPoster = (slug: string) => `/films/${slug}.jpg`;
// Short silent loop (~6s, ~0.5 MB) for anything that plays inline on the page.
export const filmLoop = (slug: string) => `/films/${slug}-loop.mp4`;
