import Link from "next/link";
import { Arrow, Envelope, Mark } from "./icons";
import s from "./Buttons.module.css";

// "#order" opens the order box (OrderModal); plain <a> so the click reaches it.
function A({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return href.startsWith("#") ? <a href={href} className={className}>{children}</a> : <Link href={href} className={className}>{children}</Link>;
}

// 1. Primary: black button whose tail melts into blue. `sm` is the header size.
export function PrimaryButton({ href, children, size = "lg" }: { href: string; children: React.ReactNode; size?: "sm" | "lg" }) {
  return (
    <A href={href} className={`btn ${s.primary} ${size === "sm" ? s.sm : s.lg}`}>
      <span className={s.label}>{children}</span>
      <span className={`key ${s.key}`}><Arrow /></span>
    </A>
  );
}

// 2. Secondary: white, 1px ring, Harkat mark, caption below.
export function SecondaryButton({ href, children, caption }: { href: string; children: React.ReactNode; caption: string }) {
  return (
    <span className={s.secWrap}>
      <Link href={href} className={`btn ${s.secondary}`}>
        <Mark size={18} />
        {children}
      </Link>
      <span className={s.caption}>{caption}</span>
    </span>
  );
}

// 3. On-dark CTA: white button with a blue tail.
export function LightButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <A href={href} className={`btn ${s.light}`}>
      <span className={s.label}>{children}</span>
      <span className={`key ${s.key}`}><Arrow /></span>
    </A>
  );
}

// 3b. Glass "Email us".
export function GlassButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className={`btn ${s.glass}`}>
      <Envelope />
      {children}
    </a>
  );
}
