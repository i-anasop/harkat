"use client";

import { useState } from "react";
import s from "./process.module.css";

// Accordion: one answer open at a time, height animated smoothly (grid 0fr → 1fr).
export default function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`${s.faqItem} ${isOpen ? s.faqOpen : ""}`}>
            <h3 className={s.faqQ}>
              <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                {q}
                <span className={s.plus} aria-hidden="true" />
              </button>
            </h3>
            <div className={s.faqPanel} id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
              <div className={s.faqInner}><p className={s.answer}>{a}</p></div>
            </div>
          </div>
        );
      })}
      <div className={s.rule} />
    </div>
  );
}
