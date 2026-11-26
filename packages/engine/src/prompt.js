const GLUE = new Set(["a", "an", "the", "for", "and", "with", "that", "your", "our", "this", "from", "into", "about", "film", "launch", "make", "video"]);

function wordsOf(text) {
  return text.split(" ").map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "")).filter(Boolean);
}

/**
 * A free-text prompt into the fields the brief already understands.
 * A missing website becomes name.example, the same stand-in the Keel sample uses.
 * Nothing here is shown as a customer result.
 */
export function briefFromPrompt(prompt, url = "") {
  const raw = String(prompt ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  const given = String(url ?? "").trim();
  const found = raw.match(/https?:\/\/\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i);
  let text = raw;
  let site = given;
  if (!site && found) {
    site = found[0].replace(/[),.;]+$/, "");
    text = raw.replace(found[0], " ").replace(/\s+/g, " ").trim();
  }
  text = text.slice(0, 500);
  if (text.length < 8 && !site) return { ok: false, reason: "Say a little more about the product." };

  const words = wordsOf(text);
  const called = text.match(/\b(?:called|named)\s+([A-Za-z][\w.-]{1,40})/);
  let name = called ? called[1] : "";
  if (!name) {
    const lead = words.find((w) => /^[A-Z]/.test(w) && w.length > 1 && !GLUE.has(w.toLowerCase()));
    const plain = words.find((w) => w.length > 2 && !GLUE.has(w.toLowerCase()));
    name = (lead || plain || "").replace(/[^A-Za-z0-9]/g, "");
  }
  name = name.slice(0, 48);
  if (name) name = name[0].toUpperCase() + name.slice(1);

  const problem = text.slice(0, 180);
  const bits = text.split(/,|;|\band\b|\./i).map((s) => s.trim()).filter((s) => wordsOf(s).length >= 2);
  const features = (bits.length ? bits : text ? [text] : []).slice(0, 4).map((s) => s.slice(0, 72));

  const inventedHost = !site;
  if (!site) {
    const slug = (name || "preview").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "preview";
    site = `https://${slug}.example`;
  }
  return { ok: true, name, problem, features, url: site, inventedHost };
}
