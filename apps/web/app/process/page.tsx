import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaPanel from "@/components/CtaPanel";
import Steps, { type Step } from "./Steps";
import Faq from "./Faq";
import LazyLoop from "@/components/LazyLoop";
import s from "./process.module.css";

export const metadata: Metadata = { title: "Process" };

const STEPS: Step[] = [
  {
    n: "01", title: "Reference",
    body: "Send a film you love — or we suggest one. We study every transition, camera move and text animation, frame by frame.",
    visual: (
      <div className={s.ref} aria-hidden="true">
        <div className={s.strip}>
          {[["f1", "0:06"], ["f2", "0:16"], ["f3", "0:27"]].map(([f, t], i) => (
            <figure key={f} className={s.shot} style={{ ["--i" as string]: i }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/films/frames/${f}.jpg`} alt="" decoding="async" />
              <figcaption>{t}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    ),
  },
  {
    n: "02", title: "Build",
    body: "We rebuild that motion with your real UI, logos and brand colours. Everything is animated in code, so it’s precise.",
    visual: (
      <div className={s.build} aria-hidden="true">
        <div className={s.buildShot}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/films/frames/f2.jpg" alt="" decoding="async" />
        </div>
        <div className={`mono ${s.code}`}>
          <div><span className={s.kw}>camera</span>.push(<span className={s.num2}>1.2</span>)</div>
          <div><span className={s.kw}>ui</span>.reveal(<span className={s.str}>&quot;agent&quot;</span>)</div>
          <div><span className={s.kw}>text</span>.rise(<span className={s.str}>&quot;Support&quot;</span>)<span className={s.caret} /></div>
        </div>
      </div>
    ),
  },
  {
    n: "03", title: "Render",
    body: "Every frame is rendered at 30 fps in 1080p, then encoded small enough to post anywhere.",
    visual: (
      <div className={s.player} aria-hidden="true">
        <LazyLoop src="/films/pond-bot-launch-loop.mp4" poster="/films/pond-bot-launch.jpg" />
        <div className={s.hud}>
          <span>Rendering</span>
          <span className={s.hudBar}><i className="scrub" /></span>
          <span className={s.hudMeta}>1080p · 30 fps</span>
        </div>
      </div>
    ),
  },
  {
    n: "04", title: "Sound",
    body: "Whooshes on the cuts, hits on the reveals, ticks on the text. Sound effects only — never music.",
    visual: (
      <div className={s.player} aria-hidden="true">
        <LazyLoop src="/films/whatsapp-booking-agent-loop.mp4" poster="/films/whatsapp-booking-agent.jpg" />
        <div className={s.mix}>
          <div className={s.cues}><span style={{ left: "18%" }}>whoosh</span><span style={{ left: "52%" }}>hit</span><span style={{ left: "82%" }}>tick</span></div>
          <div className={s.wave}>
            {[3, 5, 9, 16, 24, 30, 22, 12, 7, 5, 3, 4, 6, 12, 26, 32, 18, 9, 5, 3, 3, 5, 4, 7, 12, 20, 11, 6, 4, 3, 5, 8].map((h, i) => <i key={i} style={{ height: h }} />)}
          </div>
        </div>
      </div>
    ),
  },
  {
    n: "05", title: "Revise & ship",
    body: "You give point-by-point notes. We change exactly that — nothing else. Then the film is yours.",
    visual: (
      <div className={s.ship} aria-hidden="true">
        <div className={s.shipShot}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/films/meet-pond-ai.jpg" alt="" decoding="async" />
          <span className={s.note} style={{ top: 12, right: 12 }}><i>✓</i>Logo a touch bigger</span>
          <span className={s.note} style={{ top: 46, right: 26 }}><i>✓</i>Hold the end frame</span>
        </div>
        <div className={s.file}>
          <span className={s.check}>
            <svg width="14" height="14" viewBox="0 0 22 22"><path d="M5 11.5 L9 15.5 L17 7" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>launch_film.mp4</span>
            <span style={{ fontSize: 11.5, color: "#5B6275" }}>16:9 + 9:16 · ready to post</span>
          </span>
        </div>
      </div>
    ),
  },
];

const FAQ: [string, string][] = [
  ["Do you use music?", "No. Every film uses sound effects only — timed to the motion. It keeps the film clean and lets your product speak."],
  ["How long does a film take?", "Most launch films are ready in days. Exact timing depends on length and how many rounds of notes you give."],
  ["What do you need from us?", "Your product link, logo, brand colours and a film you like the style of. If you don’t have a reference, we’ll suggest a few."],
  ["Which format do I get?", "You choose when you order: 16:9 landscape or 9:16 vertical. You get a small, high-quality MP4 ready to post."],
  ["Are your films halal-friendly?", "Yes. We use sound effects only — never music — and we never show images of women; people appear as abstract avatars or initials. Every film is made within Islamic values."],
  ["Do you work with Muslim-owned startups?", "Yes, gladly. We work with Muslim founders and with any honest, halal business, wherever you’re based."],
  ["Do you work with any business?", "We work with honest, halal businesses — mostly AI and SaaS products."],
];

export default function Process() {
  return (
    <>
      <Nav current="/process" />
      <section className="phead">
        <span className="r1 phead-label">Process</span>
        <h1 className="r1">Idea to film,<br /><span className="muted-h">in days.</span></h1>
        <p className="r2">A simple, proven way to make agency-level films — without the agency.</p>
      </section>

      <Steps steps={STEPS} />

      <section className={s.principles}>
        <div className={s.head}>
          <span className={s.label}>Our principles</span>
          <h2 className={s.h2}>Halal by <span className="muted-h">design.</span></h2>
          <p className={s.pLede}>Films your whole community can share — at a quality that’s been hard to find.</p>
        </div>
        <ul className={s.pList}>
          <li><b>Sound, never music.</b> Every beat is a whoosh, a hit or a tick.</li>
          <li><b>People as shapes.</b> Abstract avatars and initials — never imagery of women.</li>
          <li><b>Honest products only.</b> We take on halal businesses, and every claim is real.</li>
        </ul>
      </section>

      <section className={s.split}>
        <div className={s.head}><span className={s.label}>Questions</span><h2 className={s.h2}>Good to <span className="muted-h">know.</span></h2></div>
        <Faq items={FAQ} />
      </section>

      <CtaPanel grainId="gpc" />
      <Footer />
    </>
  );
}
