import Link from "next/link";
import { Mark } from "./icons";
import { PrimaryButton } from "./Buttons";
import s from "./Nav.module.css";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/process", label: "Process" },
  { href: "/studio", label: "Studio" },
];

export default function Nav({ current }: { current?: string }) {
  return (
    <nav className={`nav ${s.nav}`}>
      <Link href="/" className={s.brand} aria-label="Harkat home">
        <Mark size={28} />
        harkat
      </Link>
      <div className={s.links}>
        {LINKS.map((l) =>
          l.href === current ? (
            <Link key={l.href} href={l.href} className={`nl ${s.current}`} aria-current="page">{l.label}</Link>
          ) : (
            <Link key={l.href} href={l.href} className="nl">{l.label}</Link>
          )
        )}
        <PrimaryButton href="#order" size="sm">Order a film</PrimaryButton>
      </div>
    </nav>
  );
}
