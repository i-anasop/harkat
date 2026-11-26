"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Mark } from "./icons";
import FilmStage, { type Cue, type FilmHandle } from "./FilmStage";
import { dayAnchor, readHistory } from "@/lib/homeState.mjs";
import s from "./PromptHome.module.css";

const LENGTHS = [15, 30, 45] as const;
type Length = (typeof LENGTHS)[number];
const KEY = "harkat.promptHistory";
const MAX = 40;

type Saved = {
  id: string;
  title: string;
  prompt: string;
  url: string;
  length: Length;
  name: string;
  at: number;
  pinned?: boolean;
  html?: string;
  duration?: number;
  events?: Cue[];
  note?: string;
};

type Turn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "film"; prompt: string; html?: string; duration?: number; events?: Cue[]; note?: string; error?: string; pending?: boolean };

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
  const write = (items: Saved[]) => localStorage.setItem(KEY, JSON.stringify(items));
  try {
    write(trimmed);
  } catch {
    const slim = trimmed.map((item, i) => (i < 6 ? item : { ...item, html: undefined, events: undefined }));
    try { write(slim); } catch { /* this browser is keeping the list to itself */ }
  }
  window.dispatchEvent(new Event("harkat-history"));
}

function subscribeSide(onChange: () => void) {
  window.addEventListener("harkat-sidebar", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("harkat-sidebar", onChange);
    window.removeEventListener("storage", onChange);
  };
}
function sideShut() {
  try { return localStorage.getItem("harkat.sidebar") === "shut"; } catch { return false; }
}
function historySnapshot() {
  try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
}
function setSide(shut: boolean) {
  localStorage.setItem("harkat.sidebar", shut ? "shut" : "open");
  window.dispatchEvent(new Event("harkat-sidebar"));
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener("harkat-theme", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("harkat-theme", onChange);
    window.removeEventListener("storage", onChange);
  };
}
function themeNow(): "light" | "dark" {
  try { return localStorage.getItem("harkat.theme") === "dark" ? "dark" : "light"; } catch { return "light"; }
}
function setTheme(theme: "light" | "dark") {
  localStorage.setItem("harkat.theme", theme);
  window.dispatchEvent(new Event("harkat-theme"));
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

function domainOf(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./i, "").toLowerCase();
    return /^(?=.{4,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/.test(host) ? host : "";
  } catch {
    return "";
  }
}

function dayStart(t: number) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const GROUPS = ["Today", "Yesterday", "Previous 7 days", "Older"] as const;

function grouped(items: Saved[], query: string, anchor: number) {
  const q = query.trim().toLowerCase();
  const matched = items.filter((item) => !q || `${item.title} ${item.prompt}`.toLowerCase().includes(q));
  const pinned = matched.filter((item) => item.pinned).sort((a, b) => b.at - a.at);
  const rest = matched.filter((item) => !item.pinned);
  const today = anchor || Date.UTC(2026, 0, 1);
  const buckets: Record<(typeof GROUPS)[number], Saved[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  for (const item of rest) {
    const start = dayStart(item.at);
    if (start >= today) buckets.Today.push(item);
    else if (start >= today - 86400000) buckets.Yesterday.push(item);
    else if (start >= today - 6 * 86400000) buckets["Previous 7 days"].push(item);
    else buckets.Older.push(item);
  }
  for (const key of GROUPS) buckets[key].sort((a, b) => b.at - a.at);
  return { pinned, buckets };
}

export default function PromptHome() {
  const historyRaw = useSyncExternalStore(subscribeHistory, historySnapshot, () => "[]");
  const history = useMemo(() => readHistory(historyRaw) as Saved[], [historyRaw]);
  const collapsed = useSyncExternalStore(subscribeSide, sideShut, () => false);
  const theme = useSyncExternalStore(subscribeTheme, themeNow, () => "light" as const);
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [urlOpen, setUrlOpen] = useState(false);
  const [swatch, setSwatch] = useState<string | null>(null);
  const [length, setLength] = useState<Length>(15);
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [last, setLast] = useState({ name: "", prompt: "", url: "" });
  const [playId, setPlayId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [prompt, turns.length]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) boxRef.current?.focus();
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#101218" : "#F6F7F9");
  }, [theme]);

  useEffect(() => {
    const domain = domainOf(url);
    if (!domain) return;
    const ac = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/brand?d=${domain}`, { signal: ac.signal })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.color) setSwatch(data.color); })
        .catch(() => {});
    }, 350);
    return () => { clearTimeout(timer); ac.abort(); };
  }, [url]);

  const remember = (item: Saved) => storeHistory([item, ...history.filter((h) => h.id !== item.id)]);
  const patch = (id: string, next: Partial<Saved>) => storeHistory(history.map((item) => item.id === id ? { ...item, ...next } : item));

  const fresh = useCallback(() => {
    setActive(null);
    setTurns([]);
    setPrompt("");
    setUrl("");
    setUrlOpen(false);
    setSwatch(null);
    setMenuFor(null);
    setDrawer(false);
    boxRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "n") { e.preventDefault(); fresh(); }
      if (meta && e.key.toLowerCase() === "b" && window.matchMedia("(min-width: 860px)").matches) {
        e.preventDefault();
        setSide(!sideShut());
      }
      if (e.key === "Escape") { setDrawer(false); setMenuFor(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fresh]);

  const openSaved = (item: Saved) => {
    setActive(item.id);
    setPrompt("");
    setUrl(item.url || "");
    setUrlOpen(Boolean(item.url));
    setSwatch(null);
    setLength(item.length);
    setLast({ name: item.name, prompt: item.prompt, url: item.url });
    const film: Turn = item.html
      ? { id: `${item.id}-film`, role: "film", prompt: item.prompt, html: item.html, duration: item.duration, events: item.events, note: item.note }
      : { id: `${item.id}-film`, role: "film", prompt: item.prompt, error: "This cut isn’t on this device anymore. Send the line again." };
    setPlayId(null);
    setTurns([{ id: `${item.id}-user`, role: "user", text: item.prompt }, film]);
    setMenuFor(null);
    setDrawer(false);
  };

  const send = async () => {
    const line = prompt.trim();
    if (busy || (line.length < 8 && !url.trim())) return;
    setBusy(true);
    const userId = crypto.randomUUID();
    const filmId = crypto.randomUUID();
    setTurns((prev) => [...prev, { id: userId, role: "user", text: line || url.trim() }, { id: filmId, role: "film", prompt: line, pending: true }]);
    setPrompt("");
    try {
      const res = await fetch("/api/studio/film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: line, url: url.trim(), length, goal: "launch", tone: "plain" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setTurns((prev) => prev.map((turn) => turn.id === filmId ? { id: filmId, role: "film", prompt: line, error: data.reason || "That preview didn’t come through. Please try again." } : turn));
        return;
      }
      const item: Saved = {
        id: userId,
        title: (line || data.name || "Film").slice(0, 60),
        prompt: line || url.trim(),
        url: url.trim(),
        length,
        name: typeof data.name === "string" ? data.name : "",
        at: Date.now(),
        html: data.html,
        duration: data.duration,
        events: Array.isArray(data.events) ? data.events : [],
        note: typeof data.note === "string" ? data.note : "",
      };
      setLast({ name: item.name, prompt: item.prompt, url: item.url });
      setActive(item.id);
      setPlayId(filmId);
      remember(item);
      setTurns((prev) => prev.map((turn) => turn.id === filmId ? { id: filmId, role: "film", prompt: line, html: data.html, duration: data.duration, events: item.events, note: item.note } : turn));
    } catch {
      setTurns((prev) => prev.map((turn) => turn.id === filmId ? { id: filmId, role: "film", prompt: line, error: "Network error. Please try again." } : turn));
    } finally {
      setBusy(false);
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) requestAnimationFrame(() => boxRef.current?.focus());
    }
  };

  const hire = () => handoff(last.name, last.prompt || prompt, last.url || url);
  const empty = turns.length === 0;
  const domain = domainOf(url);
  const groups = grouped(history, query, dayAnchor());

  const onSwipe = (e: React.PointerEvent) => {
    if (!drawer || !window.matchMedia("(max-width: 859px)").matches) return;
    const el = sideRef.current;
    if (!el) return;
    const start = e.clientX;
    el.style.transition = "none";
    const move = (ev: PointerEvent) => {
      const dx = Math.min(0, ev.clientX - start);
      el.style.transform = `translateX(${dx}px)`;
    };
    const up = (ev: PointerEvent) => {
      el.style.transition = "";
      el.style.transform = "";
      if (ev.clientX - start < -64) setDrawer(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className={s.shell} data-theme={theme} data-collapsed={collapsed ? "true" : "false"}>
      <aside ref={sideRef} className={`${s.side} ${drawer ? s.open : ""}`} onPointerDown={onSwipe}>
        <div className={s.head}>
          <button type="button" className={s.logoBtn} onClick={() => setSide(false)} title="Expand sidebar" aria-label="Expand sidebar">
            <span className={s.logoMark}><Mark size={20} /></span>
            <span className={s.logoSwap}><PanelIcon /></span>
          </button>
          <span className={s.brand}><Mark size={26} /> harkat</span>
          <button type="button" className={s.iconBtn} onClick={() => setSide(true)} title="Collapse sidebar" aria-label="Collapse sidebar"><PanelIcon /></button>
          <button type="button" className={s.drawerX} onClick={() => setDrawer(false)} aria-label="Close menu"><CloseIcon /></button>
        </div>

        <nav className={s.nav} aria-label="Studio">
          <button type="button" className={`${s.link} ${empty && !active ? s.linkOn : ""}`} onClick={fresh} title="New film">
            <ComposeIcon />
            <span className={s.linkText}>New film</span>
            <kbd className={s.kbd} title="New film · Ctrl N or ⌘ N">N</kbd>
          </button>
        </nav>

        <label className={s.search}>
          <SearchIcon />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search films" aria-label="Search films" />
        </label>
        <button type="button" className={s.searchRail} title="Search films" aria-label="Search films" onClick={() => { setSide(false); setDrawer(true); requestAnimationFrame(() => searchRef.current?.focus()); }}>
          <SearchIcon />
        </button>

        <div className={`${s.recents} bare`}>
          {history.length === 0 && <p className={s.emptyList}>Films you make show up here.</p>}
          {groups.pinned.length > 0 && (
            <section>
              <h2 className={s.group}>Pinned</h2>
              <ul className={s.rows}>
                {groups.pinned.map((item) => (
                  <HistoryRow key={item.id} item={item} active={item.id === active} menu={menuFor === item.id} onOpen={() => openSaved(item)} onMenu={() => setMenuFor(menuFor === item.id ? null : item.id)} onCloseMenu={() => setMenuFor(null)} onRename={(title) => patch(item.id, { title })} onPin={() => patch(item.id, { pinned: !item.pinned })} onDelete={() => { storeHistory(history.filter((h) => h.id !== item.id)); if (active === item.id) fresh(); }} />
                ))}
              </ul>
            </section>
          )}
          {GROUPS.map((name) => groups.buckets[name].length > 0 && (
            <section key={name}>
              <h2 className={s.group}>{name}</h2>
              <ul className={s.rows}>
                {groups.buckets[name].map((item) => (
                  <HistoryRow key={item.id} item={item} active={item.id === active} menu={menuFor === item.id} onOpen={() => openSaved(item)} onMenu={() => setMenuFor(menuFor === item.id ? null : item.id)} onCloseMenu={() => setMenuFor(null)} onRename={(title) => patch(item.id, { title })} onPin={() => patch(item.id, { pinned: !item.pinned })} onDelete={() => { storeHistory(history.filter((h) => h.id !== item.id)); if (active === item.id) fresh(); }} />
                ))}
              </ul>
            </section>
          ))}
          {history.length > 0 && groups.pinned.length === 0 && GROUPS.every((name) => groups.buckets[name].length === 0) && (
            <p className={s.emptyList}>No films match that search.</p>
          )}
        </div>

        <div className={s.foot}>
          <Link href="/pro" className={s.hire} onClick={hire} title="Hire a pro"><HireIcon /><span>Hire a pro</span></Link>
          <button type="button" className={s.footLink} title={theme === "dark" ? "Light theme" : "Dark theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </aside>
      {drawer && <button type="button" className={s.scrim} aria-label="Close menu" onClick={() => setDrawer(false)} />}

      <div className={s.main}>
        <header className={s.topbar}>
          <button type="button" className={s.menuBtn} aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><PanelIcon /></button>
          <span className={s.topBrand}><Mark size={22} /> harkat</span>
          <Link href="/pro" className={s.topHire} onClick={hire}>Hire a pro</Link>
        </header>

        {empty ? (
          <div className={`${s.intro} bare`}>
            <h1 className={s.hello}><Mark size={34} /><span>What are we making?</span></h1>
            <Composer boxRef={boxRef} prompt={prompt} setPrompt={setPrompt} url={url} setUrl={setUrl} urlOpen={urlOpen} setUrlOpen={setUrlOpen} domain={domain} swatch={swatch} setSwatch={setSwatch} length={length} setLength={setLength} busy={busy} send={send} />
          </div>
        ) : (
          <>
            <h1 className={s.sr}>Harkat</h1>
            <div className={`${s.thread} bare`} ref={threadRef}>
              {turns.map((turn) => turn.role === "user" ? (
                <p key={turn.id} className={s.user}>{turn.text}</p>
              ) : (
                <FilmBubble key={turn.id} turn={turn} autoPlay={turn.id === playId} onHire={hire} />
              ))}
            </div>
            <div className={s.dock}>
              <Composer boxRef={boxRef} prompt={prompt} setPrompt={setPrompt} url={url} setUrl={setUrl} urlOpen={urlOpen} setUrlOpen={setUrlOpen} domain={domain} swatch={swatch} setSwatch={setSwatch} length={length} setLength={setLength} busy={busy} send={send} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ item, active, menu, onOpen, onMenu, onCloseMenu, onRename, onPin, onDelete }: {
  item: Saved; active: boolean; menu: boolean; onOpen: () => void; onMenu: () => void; onCloseMenu: () => void;
  onRename: (title: string) => void; onPin: () => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const [confirm, setConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) onCloseMenu(); };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [menu, onCloseMenu]);

  const commit = () => {
    const title = draft.trim();
    if (title && title !== item.title) onRename(title);
    else setDraft(item.title);
    setEditing(false);
  };

  if (editing) {
    return (
      <li>
        <input ref={inputRef} className={s.rename} value={draft} maxLength={60} aria-label="Rename film" onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(item.title); setEditing(false); }
        }} />
      </li>
    );
  }

  return (
    <li className={s.row}>
      <button type="button" className={`${s.recent} ${active ? s.recentOn : ""}`} onClick={onOpen} title={item.title} aria-current={active ? "true" : undefined}>
        <FilmIcon />
        <span>{item.title}</span>
      </button>
      <button type="button" className={s.more} aria-label={`Actions for ${item.title}`} aria-expanded={menu} onClick={() => { setConfirm(false); onMenu(); }}><MoreIcon /></button>
      {menu && (
        <div className={s.menu} ref={menuRef} role="menu">
          {confirm ? (
            <div className={s.confirm}>
              <p>Delete this film?</p>
              <button type="button" className={s.danger} onClick={onDelete}>Delete</button>
              <button type="button" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <>
              <button type="button" role="menuitem" onClick={() => { setDraft(item.title); setEditing(true); onCloseMenu(); }}>Rename</button>
              <button type="button" role="menuitem" onClick={() => { onPin(); onCloseMenu(); }}>{item.pinned ? "Unpin" : "Pin"}</button>
              <button type="button" role="menuitem" className={s.dangerItem} onClick={() => setConfirm(true)}>Delete</button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function LengthPicker({ length, setLength }: { length: Length; setLength: (n: Length) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className={s.len} ref={ref}>
      <button type="button" className={`${s.clock} ${open ? s.clockOn : ""}`} aria-expanded={open} aria-label={`Length, ${length} seconds`} title={`${length} seconds`} onClick={() => setOpen((v) => !v)}>
        <ClockIcon />
      </button>
      {open && (
        <div className={s.lenPop} role="listbox" aria-label="Length">
          {LENGTHS.map((n) => (
            <button key={n} type="button" role="option" aria-selected={n === length} className={n === length ? s.lenOn : ""} onClick={() => { setLength(n); setOpen(false); }}>{n} seconds</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Composer({ boxRef, prompt, setPrompt, url, setUrl, urlOpen, setUrlOpen, domain, swatch, setSwatch, length, setLength, busy, send }: {
  boxRef: React.RefObject<HTMLTextAreaElement | null>;
  prompt: string; setPrompt: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  urlOpen: boolean; setUrlOpen: (v: boolean) => void;
  domain: string; swatch: string | null; setSwatch: (v: string | null) => void;
  length: Length; setLength: (v: Length) => void;
  busy: boolean; send: () => void;
}) {
  const urlRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (urlOpen) urlRef.current?.focus(); }, [urlOpen]);
  const showUrl = urlOpen || Boolean(url);
  return (
    <form className={s.box} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <textarea
        ref={boxRef}
        className={s.input}
        rows={1}
        value={prompt}
        placeholder="Describe the product…"
        maxLength={500}
        aria-label="Describe the product"
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
      />
      <div className={s.tools}>
        {showUrl ? (
          <label className={s.urlChip}>
            {domain ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/favicon?d=${domain}`} alt="" width={16} height={16} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
            ) : <LinkIcon />}
            {swatch && <i className={s.swatch} style={{ background: swatch }} title={swatch} />}
            <input ref={urlRef} value={url} onChange={(e) => { setUrl(e.target.value); setSwatch(null); }} placeholder="yoursite.com" inputMode="url" aria-label="Website" maxLength={200} />
            <button type="button" className={s.urlClear} aria-label="Remove website" onClick={() => { setUrl(""); setUrlOpen(false); setSwatch(null); }}>×</button>
          </label>
        ) : (
          <button type="button" className={s.attach} onClick={() => setUrlOpen(true)}>
            <LinkIcon /> Website
          </button>
        )}
        <LengthPicker length={length} setLength={setLength} />
        <button className={s.send} type="submit" disabled={busy || (prompt.trim().length < 8 && !url.trim())} aria-label="Make the film">
          {busy ? <span className={s.spin} /> : <ArrowUp />}
        </button>
      </div>
    </form>
  );
}

function FilmBubble({ turn, autoPlay, onHire }: { turn: Extract<Turn, { role: "film" }>; autoPlay: boolean; onHire: () => void }) {
  const stage = useRef<FilmHandle>(null);
  const [hint, setHint] = useState("");
  const share = async () => {
    const text = turn.prompt || "A launch film made with Harkat";
    if (navigator.share) {
      try { await navigator.share({ title: "Harkat", text }); return; } catch { /* dismissed */ }
    }
    try { await navigator.clipboard.writeText(text); setHint("Copied the line."); } catch { setHint("Couldn’t copy from this browser."); }
  };
  return (
    <div className={s.answer}>
      <span className={s.avatar}><Mark size={15} /></span>
      <div className={s.answerBody}>
        {turn.pending && (
          <div className={s.pending} role="status">
            <div className={s.skeleton} />
            <div className={s.loadTrack}><i /></div>
            <p>Cutting the film</p>
          </div>
        )}
        {turn.error && (
          <p className={s.err}>
            {turn.error}
            {/doesn.t make films|gambling|adult|alcohol|drug/i.test(turn.error) && <> <Link href="/docs/halal">Why we decline some work</Link></>}
          </p>
        )}
        {turn.html && typeof turn.duration === "number" && (
          <FilmStage ref={stage} html={turn.html} duration={turn.duration} events={turn.events ?? []} autoPlay={autoPlay} />
        )}
        {turn.note && <p className={s.note}>{turn.note}</p>}
        {turn.html && (
          <div className={s.actions}>
            <button type="button" onClick={() => stage.current?.replay()}>Replay</button>
            <button type="button" onClick={share}>Share</button>
            <button type="button" onClick={() => setHint("The mp4 comes with the finished film.")}>Download</button>
            <Link href="/pro" onClick={onHire}>Hire a pro to finish</Link>
          </div>
        )}
        {hint && <p className={s.hint} role="status">{hint}</p>}
      </div>
    </div>
  );
}

function PanelIcon() {
  return <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2" width="13" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M6 2.5 V13.5" stroke="currentColor" strokeWidth="1.4" /></svg>;
}
function ComposeIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.1 3.2 L12.8 6.9 L6.4 13.3 H2.7 V9.6 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 4.4 L11.6 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10.4 10.4 L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function FilmIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.6" y="3" width="12.8" height="10" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M6.6 6.2 L10.4 8 L6.6 9.8 Z" fill="currentColor" /></svg>;
}
function MoreIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.2" fill="currentColor" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /><circle cx="12.5" cy="8" r="1.2" fill="currentColor" /></svg>;
}
function HireIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M3.2 13.2c.6-2.2 2.4-3.4 4.8-3.4s4.2 1.2 4.8 3.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8 5.1 V8.1 L10 9.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function MoonIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2.2 A6 6 0 1 0 13.8 10 4.6 4.6 0 0 1 10 2.2 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}
function SunIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8 1.8 V3.4 M8 12.6 V14.2 M1.8 8 H3.4 M12.6 8 H14.2 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M12.6 3.4 L11.5 4.5 M4.5 11.5 L3.4 12.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function LinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5 L9.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M7 5.2 L8.2 4 a2.2 2.2 0 0 1 3.1 3.1 L10 8.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M9 10.8 L7.8 12 a2.2 2.2 0 0 1 -3.1 -3.1 L6 7.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function CloseIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function ArrowUp() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13 V3 M3.5 7.5 L8 3 L12.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
