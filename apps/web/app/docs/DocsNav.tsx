"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./docs.module.css";

export const DOCS = [
  { group: "Harkat", items: [
    { href: "/docs", label: "Overview" },
    { href: "/docs/how-we-make-films", label: "How we make films" },
    { href: "/docs/halal", label: "Halal by design" },
  ] },
  { group: "Work", items: [
    { href: "/docs/pond-ai", label: "Case study: Pond AI" },
    { href: "/docs/credits", label: "Credits" },
  ] },
  { group: "Legal", items: [
    { href: "/docs/terms", label: "Terms of service" },
    { href: "/docs/privacy", label: "Privacy" },
  ] },
];

export default function DocsNav() {
  const path = usePathname();
  return (
    <nav className={s.side} aria-label="Docs">
      {DOCS.map((g) => (
        <div key={g.group} className={s.group}>
          <span className={s.groupLabel}>{g.group}</span>
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} className={path === it.href ? s.on : undefined} aria-current={path === it.href ? "page" : undefined}>
              {it.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
