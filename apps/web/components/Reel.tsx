"use client";

import { useEffect, useRef } from "react";
import { FILMS, SHOW_POND_WORK, filmLoop, filmPoster } from "@/lib/site";
import FilmPreview from "./FilmPreview";
import { Grain } from "./icons";
import s from "./Reel.module.css";

// Scene order in the reel.
const ORDER = ["pond-for-ai-agents", "whatsapp-booking-agent", "pond-bot-launch", "meet-pond-ai"];
const REEL_FILMS = ORDER.map((slug) => FILMS.find((f) => f.slug === slug)!);

// Selected films: a sticky stage whose keyframes are scrubbed by scroll progress (--p).
// Progress eases toward the scroll position every frame, so wheel steps still read as
// one continuous move instead of jumps.
export default function Reel() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let target = 0, cur = 0, raf = 0;
    const ease = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.09; // reduced motion: follow scroll exactly

    const measure = () => {
      const r = el.getBoundingClientRect();
      const range = r.height - innerHeight; // sticky "contain" range
      target = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    };
    const tick = () => {
      cur += (target - cur) * ease;
      if (Math.abs(target - cur) < 0.0004) cur = target;
      el.style.setProperty("--p", cur.toFixed(5));
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { measure(); if (!raf) raf = requestAnimationFrame(tick); };

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { addEventListener("scroll", kick, { passive: true }); measure(); cur = target; kick(); }
      else removeEventListener("scroll", kick);
    });
    io.observe(el);
    addEventListener("resize", kick);

    // Only the film actually showing in the frame plays (the others sit clipped off to the side).
    const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.intersectionRatio > 0.6) v.play().catch(() => {}); else v.pause();
    }), { threshold: [0, 0.6, 1] });
    el.querySelectorAll("video").forEach((v) => vio.observe(v));

    return () => { vio.disconnect(); io.disconnect(); removeEventListener("scroll", kick); removeEventListener("resize", kick); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} className={s.reel} id="films" aria-label="Selected films">
      <div className={s.reelin}>
        <Grain id="greel" />
        <div className={s.stage}>
          {[4, 3, 2, 1].map((n) => <span key={n} className={`${s.echo} ${s[`e${n}`]}`} aria-hidden="true" />)}
          <div className={s.player}>
            <div className={s.frame}>
              <div className={s.screen}>
                {REEL_FILMS.map((f, i) => (
                  <div key={f.slug} className={`${s.sc} ${s[`sc${i + 1}`]}`}>
                    {SHOW_POND_WORK ? (
                      <video className={s.video} src={filmLoop(f.slug)} poster={filmPoster(f.slug)} muted loop playsInline preload="metadata" aria-label={f.title} />
                    ) : (
                      <FilmPreview slug={f.slug} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {REEL_FILMS.map((f, i) => (
            <div key={f.slug} className={`${s.copy} ${i % 2 ? s.left : s.right} ${s[`tx${i + 1}`]}`}>
              <span className={s.kindRow}>
                <span className={s.kind}>{f.kind}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/pond-ai-logo.png" alt="Pond AI" className={s.client} />
              </span>
              <h3 className={s.title}>{f.short}</h3>
              <p className={s.about}>{f.about}</p>
              {f.credit && (
                <a className={s.credit} href={f.credit.url} target="_blank" rel="noopener noreferrer">Idea credit: {f.credit.label}</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
