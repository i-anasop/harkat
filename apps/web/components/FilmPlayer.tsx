"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FILMS, filmPoster, filmSrc, type Film } from "@/lib/site";
import s from "./FilmPlayer.module.css";

const fmt = (t: number) => (Number.isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "0:00");

// A big, calm player box. Opens from any element with data-watch="<film slug>", on any page.
// Space plays/pauses, ←/→ skip 5s, M mutes, F goes fullscreen, Esc closes.
export default function FilmPlayer() {
  const dlg = useRef<HTMLDialogElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [film, setFilm] = useState<Film | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const d = dlg.current!;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.("[data-watch]");
      const f = el && FILMS.find((x) => x.slug === el.getAttribute("data-watch"));
      if (!f) return;
      e.preventDefault();
      setFilm(f); setT(0); setDur(0); setBuf(0);
      if (!d.open) { d.showModal(); document.documentElement.style.overflow = "hidden"; }
    };
    const onClose = () => { vid.current?.pause(); setFilm(null); document.documentElement.style.overflow = ""; };
    document.addEventListener("click", onClick);
    d.addEventListener("close", onClose);
    return () => { document.removeEventListener("click", onClick); d.removeEventListener("close", onClose); };
  }, []);

  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2200);
  }, []);

  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); wake(); };
  const seek = (to: number) => { const v = vid.current; if (v && dur) { v.currentTime = Math.max(0, Math.min(dur, to)); setT(v.currentTime); } wake(); };
  const full = () => { const el = frame.current; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.().catch(() => {}); };
  const mute = () => { const v = vid.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); wake(); };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); toggle(); }
    else if (k === "arrowright") seek(t + 5);
    else if (k === "arrowleft") seek(t - 5);
    else if (k === "m") mute();
    else if (k === "f") full();
  };

  // Click/drag on the progress bar.
  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const at = (x: number) => { const r = bar.getBoundingClientRect(); seek(((x - r.left) / r.width) * dur); };
    at(e.clientX);
    bar.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => at(ev.clientX);
    const up = () => { bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
  };

  return (
    <dialog ref={dlg} className={s.dialog} onClick={(e) => { if (e.target === e.currentTarget) dlg.current?.close(); }} onKeyDown={onKey} aria-label={film ? `${film.title} — film` : "Film"}>
      {film && (
        <div className={s.box}>
          <div ref={frame} className={`${s.frame} ${idle && playing ? s.idle : ""}`} onPointerMove={wake}>
            <video
              ref={vid}
              key={film.slug}
              className={s.video}
              src={filmSrc(film.slug)}
              poster={filmPoster(film.slug)}
              autoPlay
              playsInline
              preload="auto"
              onClick={toggle}
              onPlay={() => { setPlaying(true); wake(); }}
              onPause={() => { setPlaying(false); setIdle(false); }}
              onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
              onProgress={(e) => { const v = e.currentTarget; if (v.buffered.length) setBuf(v.buffered.end(v.buffered.length - 1)); }}
              onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
            />
            {!playing && (
              <button type="button" className={s.bigPlay} onClick={toggle} aria-label="Play">
                <svg width="22" height="22" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.8 1.8 L10.2 6 L3.8 10.2 Z" fill="#0D1222" /></svg>
              </button>
            )}
            <div className={s.controls}>
              <button type="button" className={s.ctl} onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.6" y="2" width="2.4" height="8" rx=".6" fill="currentColor" /><rect x="7" y="2" width="2.4" height="8" rx=".6" fill="currentColor" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.8 1.8 L10.2 6 L3.8 10.2 Z" fill="currentColor" /></svg>
                )}
              </button>
              <span className={s.time}>{fmt(t)}</span>
              <div className={s.bar} onPointerDown={scrub} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(t)} tabIndex={0}>
                <span className={s.buf} style={{ width: dur ? `${(buf / dur) * 100}%` : 0 }} />
                <span className={s.fill} style={{ width: dur ? `${(t / dur) * 100}%` : 0 }} />
              </div>
              <span className={s.time}>{fmt(dur)}</span>
              <button type="button" className={s.ctl} onClick={mute} aria-label={muted ? "Unmute" : "Mute"}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6h2.5l3.5-3v10l-3.5-3H2.5z" fill="currentColor" stroke="none" />
                  {muted ? <path d="M11 6l3 4M14 6l-3 4" /> : <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" />}
                </svg>
              </button>
              <button type="button" className={s.ctl} onClick={full} aria-label="Fullscreen">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1.5 5V1.5H5M9 1.5h3.5V5M12.5 9v3.5H9M5 12.5H1.5V9" /></svg>
              </button>
            </div>
          </div>
          <div className={s.meta}>
            <span className={s.title}>{film.title}</span>
            <span className={s.kind}>{film.kind} · Pond AI · {film.duration}</span>
          </div>
          <button type="button" className={s.close} onClick={() => dlg.current?.close()} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}
    </dialog>
  );
}
