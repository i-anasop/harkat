"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DOCS } from "./DocsNav";
import s from "./docs.module.css";

const FLAT = DOCS.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group })));

export function DocHeader({ title, lede, updated }: { title: string; lede: string; updated?: string }) {
  const path = usePathname();
  const here = FLAT.find((d) => d.href === path);
  return (
    <header className={s.head}>
      <span className={s.crumb}>
        <Link href="/docs">Docs</Link>
        {here && here.href !== "/docs" && <><span aria-hidden="true">/</span>{here.group}</>}
      </span>
      <h1 className={s.h1}>{title}</h1>
      <p className={s.lede}>{lede}</p>
      {updated && <span className={s.updated}>Last updated {updated}</span>}
    </header>
  );
}

// A quiet two-column summary panel (used for “the short version” blocks).
export function Glance({ label, items }: { label: string; items: { t: string; d: string }[] }) {
  return (
    <section className={s.glance} aria-label={label}>
      <span className={s.glanceLabel}>{label}</span>
      <dl className={s.glanceGrid}>
        {items.map((it) => (
          <div key={it.t}>
            <dt>{it.t}</dt>
            <dd>{it.d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// “On this page” rail; highlights the section in view.
export function Toc({ items }: { items: readonly (readonly [string, string])[] }) {
  const [on, setOn] = useState(items[0]?.[0]);
  useEffect(() => {
    const els = items.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setOn(e.target.id); }), { rootMargin: "-20% 0px -70% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav className={s.toc} aria-label="On this page">
      <span className={s.tocLabel}>On this page</span>
      {items.map(([id, label]) => <a key={id} href={`#${id}`} className={on === id ? s.tocOn : undefined}>{label}</a>)}
    </nav>
  );
}

export function PrevNext() {
  const path = usePathname();
  const i = FLAT.findIndex((d) => d.href === path);
  const prev = i > 0 ? FLAT[i - 1] : null;
  const next = i >= 0 && i < FLAT.length - 1 ? FLAT[i + 1] : null;
  return (
    <nav className={s.pager} aria-label="More docs">
      {prev ? <Link href={prev.href} className={s.pagePrev}><span>Previous</span>{prev.label}</Link> : <span />}
      {next ? <Link href={next.href} className={s.pageNext}><span>Next</span>{next.label}</Link> : <span />}
    </nav>
  );
}
