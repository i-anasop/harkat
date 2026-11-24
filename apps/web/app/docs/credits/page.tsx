import type { Metadata } from "next";
import Link from "next/link";
import { FILMS } from "@/lib/site";
import { DocHeader } from "../parts";
import s from "../docs.module.css";

export const metadata: Metadata = { title: "Credits" };

export default function Credits() {
  return (
    <>
      <DocHeader title="Credits." lede="Great motion stands on great motion. These are the films whose idea or style inspired ours — credited to their makers." />
      <article className={s.prose}>
        <table className={s.table}>
          <thead><tr><th>Our film</th><th>Idea credit</th></tr></thead>
          <tbody>
            {FILMS.map((f) => (
              <tr key={f.slug}>
                <td>{f.title}</td>
                <td>{f.credit ? <a href={f.credit.url} target="_blank" rel="noopener noreferrer">{f.credit.label} ↗</a> : <span className={s.muted}>Original direction</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>We rebuild every film from scratch around the client’s real product and never reuse footage. Read more in <Link href="/docs/how-we-make-films">How we make films</Link>.</p>
      </article>
    </>
  );
}
