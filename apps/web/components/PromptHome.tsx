"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Mark } from "./icons";
import FilmStage, { type Cue } from "./FilmStage";
import s from "./PromptHome.module.css";

const SUGGESTIONS = [
  "Keel finds the bug before the launch ships",
  "Lumen matches the brand in one click",
  "Relay shares one board with the whole team",
  "Northstar finds the lead before the call",
];

const LENGTHS = [15, 30, 45] as const;
type Length = (typeof LENGTHS)[number];
const KEY = "harkat.promptHistory";
const MAX = 8;

type Saved = {
  id: string;
  prompt: string;
  url: string;
  length: Length;
  name: string;
  at: number;
  html?: string;
  duration?: number;
  events?: Cue[];
  note?: string;
};

type Turn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "film"; html?: string; duration?: number; events?: Cue[]; note?: string; error?: string; pending?: boolean };

function parseHistory(raw: string): Saved[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((item) => item && typeof item.prompt === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function subscribeHistory(onChange: () => void) {
  window.addEventListener("harkat-history", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("harkat-history", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function storeHistory(list: Saved[]) {
  const trimmed = list.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    const slim = trimmed.map((item) => ({ id: item.id, prompt: item.prompt, url: item.url, length: item.length, name: item.name, at: item.at, note: item.note }));
    try { localStorage.setItem(KEY, JSON.stringify(slim)); } catch { /* this browser is keeping the list to itself */ }
  }
  window.dispatchEvent(new Event("harkat-history"));
}

function handoff(name: string, prompt: string, url: string) {
  const site = /\.example(?:\/|$)/i.test(url) ? "" : url.trim();
  try {
    sessionStorage.setItem("harkat.studioBrief", JSON.stringify({
      name,
      url: site,
      problem: prompt,
      notes: ["From the prompt preview", prompt, site && `Site: ${site}`].filter(Boolean).join("\n"),
    }));
  } catch { /* ordering still works without the prefill */ }
}

export default function PromptHome() {
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [length, setLength] = useState<Length>(15);
  const [menu, setMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);
  const historyRaw = useSyncExternalStore(subscribeHistory, () => localStorage.getItem(KEY) ?? "[]", () => "[]");
  const history = useMemo(() => parseHistory(historyRaw), [historyRaw]);
  const [active, setActive] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [last, setLast] = useState({ name: "", prompt: "", url: "" });
  const [playId, setPlayId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    const scroll = () => { el.scrollTop = el.scrollHeight; };
    scroll();
    const raf = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(raf);
  }, [turns]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => { if (!pickerRef.current?.contains(e.target as Node)) setMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [menu]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) boxRef.current?.focus();
  }, []);

  const remember = (item: Saved) => {
    storeHistory([item, ...history.filter((h) => h.id !== item.id)]);
  };

  const openSaved = (item: Saved) => {
    setActive(item.id);
    setPrompt(item.prompt);
    setUrl(item.url && !/\.example(?:\/|$)/i.test(item.url) ? item.url : "");
    setLength(item.length);
    setLast({ name: item.name, prompt: item.prompt, url: item.url });
    const film: Turn = item.html
      ? { id: `${item.id}-film`, role: "film", html: item.html, duration: item.duration, events: item.events, note: item.note }
      : { id: `${item.id}-film`, role: "film", error: "This cut isn’t on this device anymore. Send the line again." };
    setPlayId(null);
    setTurns([{ id: `${item.id}-user`, role: "user", text: item.prompt }, film]);
    setDrawer(false);
  };

  const fresh = () => {
    setActive(null);
    setTurns([]);
    setPrompt("");
    setUrl("");
    setDrawer(false);
    boxRef.current?.focus();
  };

  const send = async (text = prompt) => {
    const line = text.trim();
    if (busy || (line.length < 8 && !url.trim())) return;
    setBusy(true);
    setMenu(false);
    const userId = crypto.randomUUID();
    const filmId = crypto.randomUUID();
    setTurns((prev) => [...prev, { id: userId, role: "user", text: line || url.trim() }, { id: filmId, role: "film", pending: true }]);
    setPrompt("");
    try {
      const res = await fetch("/api/studio/film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: line, url: url.trim(), length, goal: "launch", tone: "plain" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setTurns((prev) => prev.map((turn) => turn.id === filmId ? { id: filmId, role: "film", error: data.reason || "That preview didn’t come through. Please try again." } : turn));
        return;
      }
      const item: Saved = {
        id: userId,
        prompt: line || url.trim(),
        url: url.trim(),
        length,
        name: typeof data.name === "string" ? data.name : "",
        at: Date.now(),
        html: data.html,
        duration: data.duration,
        events: data.events,
        note: typeof data.note === "string" ? data.note : "",
      };
      setLast({ name: item.name, prompt: item.prompt, url: item.url });
      setActive(item.id);
      setPlayId(filmId);
      remember(item);
      setTurns((prev) => prev.map((turn) => turn.id === filmId ? { id: filmId, role: "film", html: data.html, duration: data.duration, events: data.events, note: item.note } : turn));
    } catch {
      setTurns((prev) => prev.map((turn) => turn.id === filmId ? { id: filmId, role: "film", error: "Network error. Please try again." } : turn));
    } finally {
      setBusy(false);
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) requestAnimationFrame(() => boxRef.current?.focus());
    }
  };

  const empty = turns.length === 0;
  const hire = () => handoff(last.name, last.prompt || prompt, last.url || url);

  const composer = (
    <form className={s.box} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <textarea
        ref={boxRef}
        className={s.input}
        rows={1}
        value={prompt}
        placeholder="Describe the product…"
        maxLength={500}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
        }}
      />
      <div className={s.row}>
        <input className={s.url} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Website, optional" inputMode="url" aria-label="Website, optional" maxLength={200} />
        <div className={s.picker} ref={pickerRef}>
          <button type="button" className={s.length} aria-expanded={menu} onClick={() => setMenu((v) => !v)}>{length}s</button>
          {menu && (
            <div className={s.menu} role="listbox" aria-label="Length">
              {LENGTHS.map((n) => (
                <button key={n} type="button" role="option" aria-selected={n === length} className={n === length ? s.optOn : s.opt} onClick={() => { setLength(n); setMenu(false); }}>{n} seconds</button>
              ))}
            </div>
          )}
        </div>
        <button className={s.send} type="submit" disabled={busy || (prompt.trim().length < 8 && !url.trim())} aria-label="Make the film">
          {busy ? <span className={s.dot} /> : <ArrowUp />}
        </button>
      </div>
    </form>
  );

  return (
    <div className={s.shell}>
      <aside className={`${s.side} ${drawer ? s.sideOpen : ""}`}>
        <button type="button" className={s.newFilm} onClick={fresh}>New film</button>
        <div className={s.list}>
          {history.length === 0 && <p className={s.emptyList}>Films you make stay on this device.</p>}
          {history.map((item) => (
            <button key={item.id} type="button" className={item.id === active ? s.itemOn : s.item} onClick={() => openSaved(item)}>
              <span>{item.prompt}</span>
            </button>
          ))}
        </div>
      </aside>
      {drawer && <button type="button" className={s.scrim} aria-label="Close history" onClick={() => setDrawer(false)} />}

      <div className={s.main}>
        <header className={s.bar}>
          <button type="button" className={s.iconBtn} aria-label="History" aria-expanded={drawer} onClick={() => setDrawer((v) => !v)}>
            <span className={s.burger} />
          </button>
          <Link href="/" className={s.brand} aria-label="Harkat home" onClick={fresh}>
            <Mark size={26} />
            harkat
          </Link>
          <Link href="/pro" className={s.hire} onClick={hire}>Hire a pro</Link>
        </header>

        {empty ? (
          <div className={s.intro}>
            <h1 className={s.hello}><Mark size={36} /><span>What are we making?</span></h1>
            {composer}
            <div className={s.chips}>
              {SUGGESTIONS.map((line) => (
                <button key={line} type="button" className={s.chip} onClick={() => { setPrompt(line); send(line); }}>{line}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={s.thread} ref={threadRef}>
              {turns.map((turn) => turn.role === "user" ? (
                <p key={turn.id} className={s.user}>{turn.text}</p>
              ) : (
                <div key={turn.id} className={s.answer}>
                  <span className={s.avatar}><Mark size={16} /></span>
                  <div className={s.answerBody}>
                    {turn.pending && <div className={s.pending}>Cutting the film…</div>}
                    {turn.error && (
                      <p className={s.err}>
                        {turn.error}
                        {/doesn.t make films|gambling|adult|alcohol|drug/i.test(turn.error) && <> <Link href="/docs/halal">Why we decline some work</Link></>}
                      </p>
                    )}
                    {turn.html && turn.duration && turn.events && (
                      <FilmStage html={turn.html} duration={turn.duration} events={turn.events} autoPlay={turn.id === playId} />
                    )}
                    {turn.note && <p className={s.note}>{turn.note}</p>}
                    {turn.html && <p className={s.note}>A sample preview. Sound is effects only — never music. <Link href="/pro" onClick={hire}>Hire a pro</Link> to finish it.</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className={s.dock}>{composer}</div>
          </>
        )}
      </div>
    </div>
  );
}

function ArrowUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 13 V3 M3.5 7.5 L8 3 L12.5 7.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
