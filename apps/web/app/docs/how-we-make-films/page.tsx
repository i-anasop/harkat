import type { Metadata } from "next";
import Link from "next/link";
import { DocHeader } from "../parts";
import s from "../docs.module.css";

export const metadata: Metadata = { title: "How we make films" };

export default function HowWeMake() {
  return (
    <>
      <DocHeader title="Made with AI. Directed by people." lede="We build agency-quality product films with AI and code — fast, precise and true to your real product." />
      <article className={s.prose}>
        <h2>AI, used properly</h2>
        <p>Our films are <b>made with AI</b>. We work with advanced AI models together with our own code-based motion tools, and we feed them what matters: your real UI, your logo, your colours and a clear story. AI lets a small team move at the speed of a studio. It doesn’t replace taste — every film is directed, reviewed and finished by our team, frame by frame.</p>

        <h2>Built from the best motion design</h2>
        <p>Great films stand on great references. Before we build, we study a film you love — or one we suggest — frame by frame: the transitions, camera moves, text animation and pacing. Then we rebuild that motion from scratch around your product.</p>
        <p className={s.note}><b>We never copy footage.</b> When a film draws on someone else’s idea or motion style, we credit the original next to the film and on our <Link href="/docs/credits">credits page</Link>.</p>

        <h2>The process</h2>
        <ol>
          <li><b>Reference</b> — we study the film you want to feel like.</li>
          <li><b>Build</b> — we animate your real product UI in code, so every move is exact.</li>
          <li><b>Render</b> — every frame at 30 fps in 1080p.</li>
          <li><b>Sound</b> — whooshes, hits and ticks timed to the motion. Never music.</li>
          <li><b>Revise &amp; ship</b> — you send point-by-point notes; we change exactly that.</li>
        </ol>

        <h2>What you get</h2>
        <p>A final MP4 in the format you chose (16:9 landscape or 9:16 vertical), ready to post anywhere — and full ownership once paid. See <Link href="/docs/terms#ownership">Ownership &amp; licence</Link>.</p>
      </article>
    </>
  );
}
