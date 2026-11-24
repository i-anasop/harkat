import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";
import { TERMS_UPDATED } from "@/lib/legal";
import { DocHeader } from "../parts";
import s from "../docs.module.css";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <>
      <DocHeader title="Privacy." lede="We collect only what we need to make your film — and nothing else." updated={TERMS_UPDATED} />
      <article className={s.prose}>
        <h2>What we collect</h2>
        <table className={s.table}>
          <thead><tr><th>Data</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>Name and email</td><td>To confirm your brief, send payment links and deliver your film.</td></tr>
            <tr><td>Product name and links</td><td>To understand and show your product in the film.</td></tr>
            <tr><td>Your answers and notes</td><td>To make the film you asked for.</td></tr>
            <tr><td>Network address (briefly)</td><td>To stop spam and abuse of the order form. Not stored with your order.</td></tr>
          </tbody>
        </table>

        <h2>What we don’t do</h2>
        <ul>
          <li>No advertising trackers or third-party analytics cookies.</li>
          <li>We never sell or share your details.</li>
          <li>The “I’m not a robot” check runs on our own server — no third-party service sees you.</li>
        </ul>

        <h2>Where it’s kept</h2>
        <p>Orders are stored privately with our hosting provider and are only visible to the Harkat team. We keep them while we work together and for our records afterwards; ask us any time and we’ll delete your details.</p>

        <h2>Contact</h2>
        <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to see, correct or delete your data.</p>
      </article>
    </>
  );
}
