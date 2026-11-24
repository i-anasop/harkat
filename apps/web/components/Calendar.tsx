"use client";

import { useRef, useState } from "react";
import s from "./Calendar.module.css";

// Dates are plain "YYYY-MM-DD" strings in local time (no timezone shifts).
const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (v: string) => { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); };
const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function formatDue(v: string) {
  return parse(v).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function Calendar({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = ymd(today);
  const start = value ? parse(value) : today;
  const [view, setView] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [focus, setFocus] = useState(value || todayStr);
  const [trackedValue, setTrackedValue] = useState(value);
  const gridRef = useRef<HTMLDivElement>(null);

  // Follow the value when it is set from outside (e.g. a quick-pick button).
  if (value !== trackedValue) {
    setTrackedValue(value);
    if (value) {
      const d = parse(value);
      setView((v) => (v.getFullYear() === d.getFullYear() && v.getMonth() === d.getMonth() ? v : new Date(d.getFullYear(), d.getMonth(), 1)));
      setFocus(value);
    }
  }

  const y = view.getFullYear(), m = view.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first
  const days = new Date(y, m + 1, 0).getDate();
  const atFirst = y === today.getFullYear() && m === today.getMonth();

  const shift = (n: number) => setView(new Date(y, m + n, 1));

  const moveFocus = (delta: number) => {
    const d = parse(focus); d.setDate(d.getDate() + delta);
    if (d < today) return;
    const v = ymd(d);
    setFocus(v);
    if (d.getMonth() !== m || d.getFullYear() !== y) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-d="${v}"]`)?.focus());
  };
  const onKey = (e: React.KeyboardEvent) => {
    const k: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (k[e.key] != null) { e.preventDefault(); moveFocus(k[e.key]); }
  };

  return (
    <div className={`${s.cal} ${invalid ? s.invalid : ""}`}>
      <div className={s.head}>
        <span className={s.month} aria-live="polite">{view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        <span className={s.nav}>
          <button type="button" className={s.arrow} onClick={() => shift(-1)} disabled={atFirst} aria-label="Previous month">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 3 L4.5 7 L8.5 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className={s.arrow} onClick={() => shift(1)} aria-label="Next month">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5.5 3 L9.5 7 L5.5 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </span>
      </div>
      <div className={s.week} aria-hidden="true">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
      <div className={s.grid} ref={gridRef} role="group" aria-label="Choose a deadline" onKeyDown={onKey} key={`${y}-${m}`}>
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = new Date(y, m, i + 1);
          const v = ymd(d);
          const past = d < today;
          const sel = v === value;
          return (
            <button
              key={v} type="button" data-d={v}
              className={`${s.day} ${sel ? s.sel : ""} ${v === todayStr ? s.today : ""}`}
              disabled={past}
              tabIndex={v === focus ? 0 : -1}
              aria-pressed={sel}
              aria-label={d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              onClick={() => { onChange(v); setFocus(v); }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
