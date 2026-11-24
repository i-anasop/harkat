import type { Metadata } from "next";
import { FILMS, SHOW_POND_WORK } from "@/lib/site";
import { DocHeader } from "../parts";
import s from "../docs.module.css";

export const metadata: Metadata = { title: "Case study: Pond AI" };

export default function PondCase() {
  return (
    <>
      <DocHeader title="Pond’s in-house motion team." lede="An AI agents platform that needed launch-quality films, fast and often. We became the team that makes them." />

      {SHOW_POND_WORK && (
        <div className={s.banner}>
          <video src="/films/results-loop.mp4" poster="/films/results-loop.jpg" autoPlay muted loop playsInline aria-label="Pond AI films" />
        </div>
      )}

      <article className={s.prose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pond-ai-logo.png" alt="Pond AI" className={s.client} />
        <h2>The brief</h2>
        <p>Pond needed a steady stream of launch and promo films for X — fast, on-brand and agency-level.</p>
        <h2>What we did</h2>
        <p>Became their in-house motion team: launches, product drops, use-case films and announcements — every one built with Pond’s real product UI and a sound-effects-only mix.</p>
        <h2>Films shipped</h2>
        <div className={s.films}>
          {FILMS.map((f) => (
            <div key={f.slug} className={s.film}>
              <span>{f.title}</span>
              <small>{f.kind} · {f.duration}</small>
              {SHOW_POND_WORK && (
                <button type="button" data-watch={f.slug}>
                  <i aria-hidden="true"><svg width="8" height="8" viewBox="0 0 12 12"><path d="M3.5 1.8 L10 6 L3.5 10.2 Z" fill="#FFFFFF" /></svg></i>
                  Watch
                </button>
              )}
            </div>
          ))}
        </div>
      </article>
    </>
  );
}
