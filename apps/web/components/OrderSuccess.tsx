"use client";

import { useEffect, useRef } from "react";
import { Mark } from "./icons";
import type { OrderSummary } from "./OrderFlow";
import s from "./OrderSuccess.module.css";

// Calm confirmation: the Harkat mark settles in, and a thank-you.
// No personal details echoed back.
export default function OrderSuccess({ order, onDone }: { order: OrderSummary; onDone: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { const id = setTimeout(() => btn.current?.focus({ preventScroll: true }), 1100); return () => clearTimeout(id); }, []);

  return (
    <div className={s.sheet} role="status" aria-live="polite">
      <div className={s.inner}>
        <span className={s.badge} aria-hidden="true">
          <Mark size={40} className={s.mark} />
          <span className={s.tick}>
            <svg width="14" height="14" viewBox="0 0 40 40"><path className={s.check} d="M11 20.5 L17.5 27 L29.5 14" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </span>
        <span className={s.eyebrow}>Order received</span>
        <h2 className={s.title}>Thank you for choosing harkat.</h2>
        <p className={s.text}>{order.name.split(" ")[0]}, we’ll be in touch by email shortly.</p>
        <button ref={btn} type="button" className={`btn ${s.done}`} onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
