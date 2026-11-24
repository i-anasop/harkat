const TRAIL = new Set(["the", "a", "an", "and", "or", "to", "of", "for", "in", "on", "before", "with"]);

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** At most `max` words. Drop a trailing article so the line still reads. */
export function clipWords(text, max = 4) {
  const raw = String(text ?? "")
    .replace(/[^\p{L}\p{N}\s.'%+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return [];
  let words = raw.split(" ").filter(Boolean).slice(0, max);
  while (words.length > 1 && TRAIL.has(words.at(-1).toLowerCase())) words.pop();
  return words;
}

export function countWords(text) {
  const raw = String(text ?? "").replace(/\s+/g, " ").trim();
  return raw ? raw.split(" ").length : 0;
}

export function measure(text, size, weight = 800) {
  const wide = weight >= 700 ? 0.64 : 0.56;
  const w = Math.max(size, Math.ceil(String(text).length * size * wide));
  const h = Math.ceil(size * 1.18);
  return { w, h };
}

export function lineSize(words, size, weight = 800) {
  const gap = Math.round(size * 0.32);
  const widths = words.map((word) => measure(word, size, weight).w + (word.length ? Math.round(size * 0.2) : 0));
  const w = widths.reduce((sum, n) => sum + n, 0) + gap * Math.max(0, words.length - 1);
  return { w: Math.min(1500, Math.max(w, size * 2)), h: Math.ceil(size * 1.22), gap };
}

export function wordsHtml(words, highlight, start = 0.08) {
  return words
    .map((word, i) => {
      const pill = highlight && word.toLowerCase() === highlight.toLowerCase() ? " pill" : "";
      const delay = (start + i * 0.15).toFixed(2);
      return `<span class="word${pill}" data-word data-delay="${delay}">${esc(word)}</span>`;
    })
    .join(" ");
}
