import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { PrimaryButton } from "@/components/Buttons";
import { Arrow, Mark } from "@/components/icons";
import s from "./not-found.module.css";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <Nav />
      <section className={s.wrap}>
        <div className={s.glow} aria-hidden="true" />
        <span className={`r1 ${s.mark}`} aria-hidden="true"><Mark size={44} className="spin" /></span>
        <span className={`r1 mono ${s.code}`}>Error 404</span>
        <h1 className={`r1 ${s.h1}`}>Lost in <span className="muted-h">motion.</span></h1>
        <p className={`r2 ${s.p}`}>This page doesn’t exist or has moved. Let’s get you back on track.</p>
        <div className={`r3 ${s.ctas}`}>
          <PrimaryButton href="/">Back home</PrimaryButton>
          <Link href="/work" className={`lnk ${s.link}`}>See our work <Arrow stroke="#0D1222" /></Link>
        </div>
      </section>
    </>
  );
}
