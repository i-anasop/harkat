/** History and the day anchor for the prompt page. Kept out of the component so tests can lock the crash. */

const LENGTHS = new Set([15, 30, 45]);

function cleanMessages(item, prompt, film) {
  if (Array.isArray(item.messages)) {
    return item.messages.filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "film") && (typeof m.text === "string" || m.role === "film")).slice(0, 40);
  }
  const messages = [{ role: "user", text: prompt }];
  if (film.html) messages.push({ role: "film", prompt, html: film.html, duration: film.duration, events: film.events, note: film.note });
  return messages;
}

export function readHistory(raw) {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const prompt = typeof item.prompt === "string" ? item.prompt : "";
      if (!prompt.trim()) continue;
      const title = typeof item.title === "string" && item.title.trim() ? item.title.trim().slice(0, 60) : prompt.trim().slice(0, 60);
      const at = typeof item.at === "number" && Number.isFinite(item.at) ? item.at : 0;
      const length = LENGTHS.has(item.length) ? item.length : 15;
      const events = Array.isArray(item.events)
        ? item.events.filter((cue) => cue && typeof cue.t === "number" && typeof cue.sfx === "string")
        : [];
      const messages = cleanMessages(item, prompt, { html: typeof item.html === "string" ? item.html : undefined, duration: typeof item.duration === "number" ? item.duration : undefined, events, note: typeof item.note === "string" ? item.note : "" });
      out.push({
        id: typeof item.id === "string" && item.id ? item.id : `h-${out.length}`,
        title,
        prompt,
        url: typeof item.url === "string" ? item.url : "",
        length,
        name: typeof item.name === "string" ? item.name : "",
        at,
        pinned: item.pinned === true,
        html: typeof item.html === "string" ? item.html : undefined,
        duration: typeof item.duration === "number" ? item.duration : undefined,
        events,
        note: typeof item.note === "string" ? item.note : "",
        messages,
      });
      if (out.length >= 40) break;
    }
    return out;
  } catch {
    return [];
  }
}

let anchor = 0;

/** Same number on every read. A fresh Date.now() inside useSyncExternalStore loops forever. */
export function clientDayAnchor(now) {
  if (!anchor) anchor = startOfDay(now);
  return anchor;
}

export function resetDayAnchor() {
  anchor = 0;
}

export function startOfDay(t) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dayAnchor() {
  if (typeof window === "undefined") return 0;
  return clientDayAnchor(Date.now());
}
