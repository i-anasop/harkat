import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { PrimaryButton } from "@/components/Buttons";
import { Arrow, Mark } from "@/components/icons";
import { CONTACT_EMAIL } from "@/lib/site";
import s from "../not-found.module.css";

export const metadata: Metadata = { title: "Payment received", robots: { index: false } };

// Where NOWPayments sends clients after paying. The order itself is marked paid by the IPN webhook.
export default function Paid() {
  return (
    <>
      <Nav />
      <section className={s.wrap}>
        <div className={s.glow} aria-hidden="true" />
        <span className={`r1 ${s.mark}`} aria-hidden="true"><Mark size={44} className="spin" /></span>
        <span className={`r1 mono ${s.code}`}>Payment sent</span>
        <h1 className={`r1 ${s.h1}`}>JazakAllahu khayran. <span className="muted-h">We’re on it.</span></h1>
        <p className={`r2 ${s.p}`}>Once the network confirms your payment, production starts. We’ll email you with first drafts — questions any time at {CONTACT_EMAIL}.</p>
        <div className={`r3 ${s.ctas}`}>
          <PrimaryButton href="/">Back home</PrimaryButton>
          <Link href="/work" className={`lnk ${s.link}`}>See our work <Arrow stroke="#0D1222" /></Link>
        </div>
      </section>
    </>
  );
}
