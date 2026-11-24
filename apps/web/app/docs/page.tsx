import type { Metadata } from "next";
import Link from "next/link";
import { DocHeader } from "./parts";
import s from "./docs.module.css";

export const metadata: Metadata = { title: "Docs" };

const INDEX = [
  { group: "Harkat", rows: [
    { href: "/docs/how-we-make-films", t: "How we make films", d: "Made with AI, directed by people — our process and how we credit references." },
    { href: "/docs/halal", t: "Halal by design", d: "No music, no imagery of women, halal products only — and why it matters." },
  ] },
  { group: "Work", rows: [
    { href: "/docs/pond-ai", t: "Case study: Pond AI", d: "How we became Pond’s in-house motion team, and the films we shipped." },
    { href: "/docs/credits", t: "Credits", d: "The motion work that inspired our films, credited to its makers." },
  ] },
  { group: "Legal", rows: [
    { href: "/docs/terms", t: "Terms of service", d: "Ownership, licence, payment, revisions and refunds — in plain language." },
    { href: "/docs/privacy", t: "Privacy", d: "What we collect when you order, where it’s kept and who sees it." },
  ] },
];

export default function DocsHome() {
  return (
    <>
      <DocHeader title="How Harkat works." lede="Everything behind the films — our process, our principles, our work and the terms we work by." />
      <div className={s.index}>
        {INDEX.map((g) => (
          <section key={g.group} className={s.indexGroup}>
            <h2 className={s.indexLabel}>{g.group}</h2>
            <div className={s.rows}>
              {g.rows.map((r) => (
                <Link key={r.href} href={r.href} className={s.row}>
                  <span><span className={s.rowTitle}>{r.t}</span><span className={s.rowText}>{r.d}</span></span>
                  <span className={s.rowArrow} aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6 H10 M6.5 2.5 L10 6 L6.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
