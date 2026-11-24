"use client";

import { useEffect, useRef, useState } from "react";
import s from "./HeroFilm.module.css";

// The hero film waits on its poster until the visitor scrolls, then plays while it is
// mostly on screen and pauses when it mostly leaves. One reconcile() decides the state,
// with hysteresis (on at 50% visible, off below 25%) so small scrolls don't flicker it.
// A manual pause is respected until the film leaves the screen.
export default function HeroFilm() {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false); // pressed pause: stay paused until the film leaves the screen
  const userStarted = useRef(false); // pressed play: overrides the scroll / reduced-motion gate

  useEffect(() => {
    const el = box.current!, v = video.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let inView = false, armed = window.scrollY > 40;

    const reconcile = () => {
      const want = inView && document.visibilityState === "visible" && !userPaused.current && (userStarted.current || (armed && !reduce));
      if (want && v.paused) v.play().catch(() => {});
      else if (!want && !v.paused) v.pause();
    };

    const io = new IntersectionObserver(([e]) => {
      const r = e.intersectionRatio;
      if (!inView && r >= 0.5) inView = true;
      else if (inView && r < 0.25) { inView = false; userPaused.current = false; userStarted.current = false; }
      reconcile();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    const onScroll = () => { if (!armed && window.scrollY > 40) { armed = true; reconcile(); } };
    const onVis = () => reconcile();
    const sync = () => setPlaying(!v.paused);

    // Don’t compete with the page itself: start buffering the film once everything else has loaded.
    const warm = () => { if (v.preload === "none") v.preload = "auto"; };
    if (document.readyState === "complete") setTimeout(warm, 300); else addEventListener("load", () => setTimeout(warm, 300), { once: true });

    io.observe(el);
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      v.removeEventListener("play", sync);
      v.removeEventListener("pause", sync);
    };
  }, []);

  const toggle = () => {
    const v = video.current!;
    if (v.paused) { userPaused.current = false; userStarted.current = true; v.play().catch(() => {}); }
    else { userPaused.current = true; v.pause(); }
  };

  return (
    <section className={`r4 ${s.sec}`}>
      <div ref={box} className={`${s.stage} ${playing ? s.playing : ""}`}>
        <video ref={video} className={s.video} src="/assets/harkat-hero.mp4" poster="/assets/harkat-hero-poster.jpg" muted loop playsInline preload="none" aria-label="Harkat — our story" onClick={toggle} />
        <button type="button" className={s.play} onClick={toggle} aria-label={playing ? "Pause film" : "Play film"}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.6" y="2" width="2.4" height="8" rx=".6" fill="#0D1222" /><rect x="7" y="2" width="2.4" height="8" rx=".6" fill="#0D1222" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.8 1.8 L10.2 6 L3.8 10.2 Z" fill="#0D1222" /></svg>
          )}
        </button>
      </div>
    </section>
  );
}
