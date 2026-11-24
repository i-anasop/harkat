import type { Metadata } from "next";
import Link from "next/link";
import { DocHeader, Glance } from "../parts";
import s from "../docs.module.css";

export const metadata: Metadata = { title: "Halal by design" };

const RULES = [
  { t: "Sound, never music", d: "Every film is scored with sound effects only — whooshes on the cuts, hits on reveals, ticks on text." },
  { t: "People as shapes", d: "We never show images of women. People appear as abstract avatars or initials, so the story stays on your product." },
  { t: "Honest claims", d: "Every number and promise in a film must be real. No fake reviews, logos or results." },
  { t: "Halal products only", d: "We work with honest, halal businesses — mostly AI and SaaS products." },
];

export default function Halal() {
  return (
    <>
      <DocHeader title="Halal by design." lede="Films your whole community can share — at a quality that’s been hard to find. Built for Muslim founders, and for anyone who values clean, honest work." />
      <Glance label="Our four principles" items={RULES} />
      <article className={s.prose}>
        <h2>Why we work this way</h2>
        <p>Muslim founders often want launch films that look world-class — but most studios lean on music and imagery they’d rather not publish. Harkat exists so you don’t have to choose. Our films are made within Islamic values from the first frame, so you can share them with your team, your users and your family without a second thought.</p>
        <h2>What we don’t make</h2>
        <p>We politely decline films for gambling, alcohol, interest-based lending (riba), adult content, or anything deceptive. If we’re unsure whether a product fits, we’ll talk it through with you before taking the order.</p>
        <h2>Does this limit the film?</h2>
        <p>No. Motion, sound design and your real product carry the story — which is exactly what makes a product film memorable. See our <Link href="/work">work</Link>.</p>
      </article>
    </>
  );
}
