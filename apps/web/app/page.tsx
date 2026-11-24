import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaPanel from "@/components/CtaPanel";
import Stats from "@/components/Stats";
import Reel from "@/components/Reel";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Arrow } from "@/components/icons";
import HeroFilm from "@/components/HeroFilm";
import s from "./home.module.css";

export default function Home() {
  return (
    <>
      <Nav />
      <section className={s.hero}>
        <span className={`r1 eyebrow`}>Launch films for AI &amp; SaaS products</span>
        <h1 className={`r1 ${s.h1}`}>Your motion team, without the agency</h1>
        <p className={`r2 ${s.lede}`}>Agency-quality product films with your real UI and crafted sound — delivered in days, not months.</p>
        <div className={`r3 ${s.ctas}`}>
          <PrimaryButton href="#order">Order a film</PrimaryButton>
          <SecondaryButton href="/work" caption="Real launches, real products">See our work</SecondaryButton>
        </div>
        <Link href="/studio" className="lnk r4">Preview a film from a brief</Link>
      </section>

      <HeroFilm />

      <section className={s.client}>
        <span className="eyebrow">Worked with</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pond-ai-logo.png" alt="Pond AI" style={{ height: 30, width: "auto" }} />
      </section>

      <Reel />

      <section className={s.results}>
        <div className={s.resultsHead}>
          <span className={s.label}>Results</span>
          <h2 className={s.h2}>Real films. <span className="muted-h">Real numbers.</span></h2>
        </div>
        <Stats />
        <Link href="/docs/pond-ai" className={`lnk ${s.story}`}>Read the Pond AI story <Arrow stroke="#0D1222" /></Link>
      </section>

      <CtaPanel grainId="gc" />
      <Footer />
    </>
  );
}
