/** The model may only shorten words that are already in the brief. No new claims, no digits. */

export function acceptFill(brief, fill) {
  if (!fill || typeof fill !== "object") return null;
  const have = new Set(
    `${brief.problem} ${brief.name} ${brief.features.join(" ")}`
      .toLowerCase()
      .match(/[a-z0-9']+/g) ?? [],
  );
  const okWords = (value, maxWords) => {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!text || /\d/.test(text)) return null;
    const list = text.split(" ");
    if (list.length > maxWords) return null;
    if (!list.every((w) => have.has(w.toLowerCase().replace(/[^a-z0-9']/g, "")) || w.length < 3)) return null;
    return text;
  };
  const hook = okWords(fill.hook, 12);
  const swaps = Array.isArray(fill.swaps) ? fill.swaps.map((s) => okWords(s, 4)).filter(Boolean) : [];
  if (!hook && swaps.length < 1) return null;
  return { hook, swaps };
}

export function applyFill(brief, fill) {
  const accepted = acceptFill(brief, fill);
  if (!accepted) return brief;
  const next = { ...brief };
  if (accepted.hook) next.problem = accepted.hook;
  if (accepted.swaps.length) next.swapOverride = accepted.swaps;
  return next;
}
