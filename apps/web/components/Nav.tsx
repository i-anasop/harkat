"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mark } from "./icons";
import { PrimaryButton } from "./Buttons";
import s from "./Nav.module.css";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/process", label: "Process" },
  { href: "/studio", label: "Studio" },
];

export default function Nav({ current }: { current?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    const mq = window.matchMedia("(min-width: 721px)");
    const onMq = () => { if (mq.matches) setOpen(false); };
    window.addEventListener("hashchange", close);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("hashchange", close);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className={`nav ${s.nav} ${open ? s.navOpen : ""}`}>
      <div className={s.bar}>
        <Link href="/" className={s.brand} aria-label="Harkat home" onClick={() => setOpen(false)}>
          <Mark size={28} />
          harkat
        </Link>
        <button
          type="button"
          className={s.menu}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={s.burger} />
          <span className={s.menuLabel}>{open ? "Close" : "Menu"}</span>
        </button>
      </div>
      <div id="site-menu" className={`${s.links} ${open ? s.open : ""}`}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={l.href === current ? `nl ${s.current}` : "nl"}
            aria-current={l.href === current ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <PrimaryButton href="#order" size="sm">Order a film</PrimaryButton>
      </div>
    </nav>
  );
}
