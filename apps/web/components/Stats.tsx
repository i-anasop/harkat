import s from "./Stats.module.css";

// The 3 real stats. Do not add or change numbers without a real source.
const STATS = [
  { tag: "Shipped", num: "14", unit: "+", label: "Films shipped for Pond AI" },
  { tag: "Length", num: "30–40", unit: "s", label: "Typical film length" },
  { tag: "Music", num: "0", unit: "", label: "Music tracks — sound effects only", blue: true },
];

export default function Stats() {
  return (
    <div className={s.card}>
      {STATS.map((t) => (
        <div key={t.tag} className={s.cell}>
          <span className={`mono ${s.tag}`}>{t.tag}</span>
          <span className={`${s.num} ${t.blue ? s.blue : ""}`}>{t.num}{t.unit && <small>{t.unit}</small>}</span>
          <span className={s.label}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}
