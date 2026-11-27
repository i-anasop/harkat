export type Goal = "launch" | "feature" | "explainer";
export type Tone = "quiet" | "plain" | "bold";

export type BriefInput = {
  name?: string;
  problem?: string;
  oneLiner?: string;
  features?: string[];
  accent?: string;
  url?: string;
  logo?: string | null;
  /** When true, the end card says this is a sample film. */
  sample?: boolean;
  audience?: string;
  proof?: string;
  goal?: Goal;
  tone?: Tone;
  length?: 15 | 30 | 45;
  /** Older studio values. Mapped onto goal. */
  template?: "launch" | "holo" | "workflow" | "auto" | Goal;
};

export type Cue = {
  t: number;
  sfx: "tick" | "click" | "whoosh" | "chime" | "thud" | "ui";
  gain?: number;
  align?: "start" | "peak";
};

export type ComposeOk = {
  ok: true;
  html: string;
  duration: number;
  events: Cue[];
  hostname: string;
  template: Goal;
  goal: Goal;
  length: number;
  accent: string;
  planSource?: "rules" | "model";
  planCost?: number;
  /** model id, "cache", "no-key", "quota", or "off". Empty when the rule planner ran on its own. */
  planNote?: string;
};

export type ComposeNo = { ok: false; reason: string };

export type SiteExtract = {
  name: string;
  tagline: string;
  color: string | null;
  logoHref: string | null;
  logoSvg: string | null;
  excerpt?: string;
  font?: string;
};

export function compose(input: BriefInput, opts?: { fontUrl?: string }): ComposeOk | ComposeNo;
export function composeWithModel(
  input: BriefInput,
  opts?: { fontUrl?: string; siteText?: string; timeout?: number; seed?: string | number; ip?: string; brandFont?: string; frame?: "landscape" | "portrait"; plan?: unknown },
): Promise<ComposeOk | ComposeNo>;
export function screenText(text: string): { ok: true } | { ok: false; reason: string };
export function extractSite(html: string, pageUrl: string): SiteExtract;
export function fetchPublicPage(url: string, opts?: { timeout?: number; maxBytes?: number }): Promise<{ url: string; html: string }>;
export function fetchImageData(url: string, opts?: { timeout?: number; maxBytes?: number }): Promise<string | null>;
export function isBlockedIp(ip: string): boolean;
export function estimatePlannerCost(brief: { name?: string; problem?: string; features?: string[]; audience?: string; goal?: string; tone?: string; length?: number; proof?: string; hostname?: string }, siteText?: string): { inputTokens: number; outputTokens: number; usd: number };
export function briefFromPrompt(prompt: string, url?: string):
  | { ok: true; name: string; problem: string; features: string[]; url: string; inventedHost: boolean }
  | { ok: false; reason: string };
