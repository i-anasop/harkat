import assert from "node:assert/strict";
import test from "node:test";
import { extractSite, fetchPublicPageRetry, isBlockedIp, sanitizeSvg, vetUrl } from "../src/site.js";

const FIXTURE = `<!doctype html><html><head>
<title>Keel — Ship the review</title>
<meta name="description" content="Reviews that ship.">
<meta property="og:image" content="https://cdn.example/og.png">
<meta name="theme-color" content="#0E7C66">
<link rel="apple-touch-icon" href="/apple-touch.png">
<link rel="icon" href="/favicon.ico">
<style>:root{--brand:#112233}</style>
</head><body><header><svg id="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><circle fill="#0E7C66" cx="5" cy="5" r="4"/></svg></header></body></html>`;

test("extractor reads the logo, colour, name and tagline from a fixture", () => {
  const site = extractSite(FIXTURE, "https://keel.example/home");
  assert.equal(site.name, "Keel");
  assert.equal(site.tagline, "Reviews that ship.");
  assert.equal(site.color, "#0E7C66");
  assert.equal(site.logoHref, "https://keel.example/apple-touch.png");
  assert.match(site.logoSvg, /<svg/i);
  assert.doesNotMatch(site.logoSvg, /<script/i);
});

test("svg sanitizer drops script and event handlers", () => {
  const clean = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><script>bad()</script><rect onload="alert(1)" /></svg>');
  assert.ok(clean);
  assert.doesNotMatch(clean, /script|onload|javascript:/i);
  assert.equal(sanitizeSvg("<div>no</div>"), null);
});

test("a failed page fetch is retried once with a browser user agent", async () => {
  const lookup = async () => [{ address: "93.184.216.34" }];
  const agents = [];
  let n = 0;
  const fetchImpl = async (_url, opts) => {
    agents.push(opts.headers["user-agent"]);
    n += 1;
    if (n === 1) throw new Error("blocked");
    return {
      ok: true,
      status: 200,
      headers: { get: (name) => (name === "content-type" ? "text/html" : null) },
      arrayBuffer: async () => new TextEncoder().encode("<html>ok</html>").buffer,
    };
  };
  const page = await fetchPublicPageRetry("https://linear.app", { lookupFn: lookup, fetchImpl, timeout: 1000 });
  assert.equal(agents[0], "HarkatBot/1.0");
  assert.match(agents[1], /Mozilla\/5\.0/);
  assert.match(page.html, /ok/);
});

test("private addresses and odd ports are blocked without a live lookup", async () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.9", "172.16.0.4", "169.254.169.254", "::1", "0.0.0.0"]) {
    assert.equal(isBlockedIp(ip), true, ip);
  }
  assert.equal(isBlockedIp("8.8.8.8"), false);
  const lookup = async () => [{ address: "93.184.216.34" }];
  await assert.rejects(() => vetUrl("http://127.0.0.1/latest/meta-data", lookup), /private|blocked/i);
  await assert.rejects(() => vetUrl("http://2130706433/", lookup), /private|blocked/i);
  await assert.rejects(() => vetUrl("https://metadata.google.internal/computeMetadata/v1/", lookup), /blocked/i);
  await assert.rejects(() => vetUrl("https://keel.example:22/secret", lookup), /port/i);
  await assert.rejects(() => vetUrl("https://evil.example", async () => [{ address: "10.0.0.8" }]), /private/i);
  const ok = await vetUrl("https://keel.example/docs", lookup);
  assert.equal(ok.hostname, "keel.example");
});
