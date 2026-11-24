import { PLANS, type PlanKey } from "@/lib/order";
import { Arrow } from "./icons";
import s from "./PlanPicker.module.css";

// Step 0 of ordering: three plans side by side; choosing one opens the full-screen flow.
export default function PlanPicker({ current, onPick }: { current?: PlanKey; onPick: (k: PlanKey) => void }) {
  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <h2 id="order-title" className={s.title}>Pick your film.</h2>
        <p className={s.sub}>Founding prices. Pay securely when you order.</p>
      </div>
      <div className={s.plans}>
        {PLANS.map((p, i) => {
          const hot = "popular" in p && p.popular;
          return (
            <article key={p.key} className={`${s.plan} ${hot ? s.hot : ""} ${current === p.key ? s.current : ""}`} style={{ animationDelay: `${0.08 + i * 0.07}s` }}>
              {hot && <span className={s.badge}>Most popular</span>}
              <div className={s.planTop}>
                <span className={s.name}>{p.name}</span>

              </div>
              <div className={s.price}><span className={s.cur}>$</span>{p.price}<span className={s.per}>/ film</span></div>
              <p className={s.blurb}>{p.blurb}</p>
              <button type="button" className={`btn ${s.cta}`} onClick={() => onPick(p.key)}>
                <span className={s.ctaLabel}>Choose {p.name}</span>
                <span className={`key ${s.ctaKey}`}><Arrow /></span>
              </button>
              <div className={s.specs}>
                <span className={s.spec}><b>{p.length}</b> film</span>
              </div>
              <ul className={s.perks}>
                {p.perks.map((perk) => (
                  <li key={perk}>
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.4 L5.6 10.3 L11.5 3.8" fill="none" stroke="#2E4BDB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {perk}
                  </li>
                ))}
              </ul>
              <div className={s.delivery}>
                <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                Delivered in {p.delivery}
              </div>
            </article>
          );
        })}
      </div>
      <p className={s.foot}>Sound effects only · Your real UI · Halal by design</p>
    </div>
  );
}
