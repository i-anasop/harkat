"use client";

import { useEffect, useRef, useState } from "react";
import s from "./process.module.css";

export type Step = { n: string; title: string; body: string; visual: React.ReactNode };

// Sticky step list on the left; the card closest to the middle of the screen is "active".
export default function Steps({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className={s.how}>
      <aside className={s.side}>
        <span className={s.label}>How it works</span>
        <h2 className={s.h2}>Five steps. <span className="muted-h">No surprises.</span></h2>
        <ol className={s.nav}>
          {steps.map((st, i) => (
            <li key={st.n} className={i === active ? s.navOn : undefined}>
              <a href={`#step-${st.n}`}><span className="mono">{st.n}</span>{st.title}</a>
            </li>
          ))}
        </ol>
      </aside>
      <div className={s.cards}>
        {steps.map((st, i) => (
          <article key={st.n} id={`step-${st.n}`} data-i={i} ref={(el) => { refs.current[i] = el; }} className={`${s.card} ${i === active ? s.cardOn : ""}`}>
            <div className={s.visual}>{st.visual}</div>
            <div className={s.cardBody}>
              <span className={`mono ${s.num}`}>{st.n}</span>
              <h3 className={s.cardTitle}>{st.title}</h3>
              <p className={s.cardText}>{st.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
