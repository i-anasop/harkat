import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata.internal"]);

export function isBlockedIp(ip) {
  const raw = String(ip).toLowerCase().replace(/^::ffff:/, "");
  if (raw === "::1" || raw === "0.0.0.0" || raw === "::") return true;
  if (raw.startsWith("fe80") || raw.startsWith("fc") || raw.startsWith("fd")) return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(raw);
  if (!m) return false;
  const n = m.slice(1).map(Number);
  if (n.some((part) => part > 255)) return true;
  const [a, b] = n;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function expandHost(host) {
  if (/^\d+$/.test(host)) {
    const n = Number(host);
    if (Number.isSafeInteger(n) && n >= 0 && n <= 0xffffffff) {
      return `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
    }
  }
  return host.replace(/^\[|\]$/g, "");
}

/** Resolve and reject private, link-local, and loopback targets. `lookupFn` is for tests. */
export async function vetUrl(raw, lookupFn = lookup) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That link could not be read.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https links are fetched.");
  if (url.username || url.password) throw new Error("Links with a password are blocked.");
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  if (port !== "80" && port !== "443") throw new Error("Only ports 80 and 443 are fetched.");
  const host = expandHost(url.hostname);
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    throw new Error("That host is blocked.");
  }
  const ips = isIP(host) ? [host] : (await lookupFn(host, { all: true })).map((row) => row.address);
  if (!ips.length || ips.some((ip) => isBlockedIp(ip))) throw new Error("That address is private.");
  return url;
}

export function plainText(value, max = 140) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function normalizeHex(value) {
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(value ?? "").trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 36 || max < 48 || max > 245) return null;
  return `#${hex.toUpperCase()}`;
}

export function sanitizeSvg(svg) {
  if (typeof svg !== "string") return null;
  let text = svg.trim();
  if (!text || text.length > 80_000 || !/^<svg[\s>]/i.test(text)) return null;
  text = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(?:iframe|embed|object|foreignObject)[\s\S]*?<\/(?:iframe|embed|object|foreignObject)>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
  if (/<script|javascript:|foreignObject|<\s*iframe|<\s*embed|<\s*object|\son\w+\s*=/i.test(text)) return null;
  return text;
}

function tagAttr(tag, name) {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? m[2] ?? m[3] ?? "" : "";
}

function absUrl(href, base) {
  if (!href || href.startsWith("data:")) return null;
  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Read name, tagline, colour and logo candidates from HTML. No network.
 * Logo order: apple-touch-icon, og:image, an svg marked as a logo, favicon.
 */
export function extractSite(html, pageUrl) {
  const source = String(html ?? "").slice(0, 500_000);
  const withoutScripts = source.replace(/<script[\s\S]*?<\/script>/gi, " ");
  const metas = [...withoutScripts.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...withoutScripts.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const meta = (key) => {
    for (const tag of metas) {
      const prop = (tagAttr(tag, "property") || tagAttr(tag, "name") || tagAttr(tag, "itemprop")).toLowerCase();
      if (prop === key) return tagAttr(tag, "content");
    }
    return "";
  };
  const link = (relTest) => {
    for (const tag of links) {
      const rel = tagAttr(tag, "rel").toLowerCase();
      if (relTest(rel)) return tagAttr(tag, "href");
    }
    return "";
  };
  const title = meta("og:title") || (withoutScripts.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const name = plainText(title.split(/[|\-–—]/)[0], 48);
  const tagline = plainText(meta("og:description") || meta("description"), 180);
  const cssVar = withoutScripts.match(/--(?:brand|accent|primary)\s*:\s*(#[0-9a-fA-F]{3,6})/i)?.[1] ?? "";
  const svgTag = withoutScripts.match(/<svg\b[^>]*(?:id|class)\s*=\s*["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<\/svg>/i)?.[0]
    || withoutScripts.match(/<header\b[^>]*>[\s\S]*?(<svg\b[\s\S]*?<\/svg>)/i)?.[1]
    || "";
  const svgFill = svgTag.match(/fill\s*[:=]\s*["']?(#[0-9a-fA-F]{3,6})/i)?.[1] ?? "";
  const color = normalizeHex(meta("theme-color")) || normalizeHex(cssVar) || normalizeHex(svgFill);
  const logoHref = absUrl(link((rel) => rel.split(/\s+/).includes("apple-touch-icon")), pageUrl)
    || absUrl(meta("og:image"), pageUrl)
    || absUrl(link((rel) => rel.split(/\s+/).includes("icon")), pageUrl);
  return {
    name,
    tagline,
    color,
    logoHref,
    logoSvg: sanitizeSvg(svgTag),
  };
}

async function readCapped(res, maxBytes) {
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("That page is too big.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error("That page is too big.");
  return buf;
}

export async function fetchPublicPage(raw, opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const lookupFn = opts.lookupFn;
  const timeout = opts.timeout ?? 4000;
  const maxBytes = opts.maxBytes ?? 400_000;
  let current = raw;
  for (let hop = 0; hop < 3; hop++) {
    const url = await vetUrl(current, lookupFn);
    const res = await fetchImpl(url.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeout),
      headers: { accept: "text/html,application/xhtml+xml", "user-agent": "HarkatBot/1.0" },
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const next = res.headers.get("location");
      if (!next) throw new Error("Redirect was empty.");
      current = new URL(next, url).href;
      continue;
    }
    if (!res.ok) throw new Error("That page did not load.");
    const type = res.headers.get("content-type") || "";
    if (type && !/text\/html|application\/xhtml/i.test(type)) throw new Error("That page is not HTML.");
    const buf = await readCapped(res, maxBytes);
    return { url: url.href, html: buf.toString("utf8") };
  }
  throw new Error("Too many redirects.");
}

export async function fetchImageData(raw, opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const url = await vetUrl(raw, opts.lookupFn);
  const res = await fetchImpl(url.href, {
    redirect: "manual",
    signal: AbortSignal.timeout(opts.timeout ?? 2500),
    headers: { accept: "image/*,image/svg+xml", "user-agent": "HarkatBot/1.0" },
  });
  if (!res.ok || res.status >= 300) return null;
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowed.includes(type)) return null;
  const buf = await readCapped(res, opts.maxBytes ?? 80_000);
  if (type === "image/svg+xml") {
    const svg = sanitizeSvg(buf.toString("utf8"));
    if (!svg) return null;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  return `data:${type};base64,${buf.toString("base64")}`;
}
