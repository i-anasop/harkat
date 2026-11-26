import Link from "next/link";
import { Mark } from "./icons";
import { CONTACT_EMAIL, LINKEDIN_URL, X_URL } from "@/lib/site";
import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.top}>
        <span className={s.left}>Motion films for AI &amp; SaaS<Link href="/">Try a film</Link><Link href="/docs">Docs</Link><Link href="/docs/pond-ai">Case study</Link><Link href="/docs/terms">Terms</Link><Link href="/docs/privacy">Privacy</Link></span>
        <span className={s.social}>
          <a href={X_URL} className="lnk" target="_blank" rel="noopener noreferrer">X</a>
          <a href={LINKEDIN_URL} className="lnk" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="lnk">Email</a>
        </span>
      </div>
      <div className={s.mark}>
        <Mark size={120} className={s.svg} />
        <span className={s.word}>harkat</span>
      </div>
    </footer>
  );
}
