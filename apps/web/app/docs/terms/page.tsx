import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { TERMS_UPDATED } from "@/lib/legal";
import { DocHeader, Glance, Toc } from "../parts";
import s from "../docs.module.css";

export const metadata: Metadata = { title: "Terms of service" };

const SHORT = [
  { t: "You own your film", d: "Once paid, the final film is yours to use anywhere, forever — commercially, on any platform, in any edit." },
  { t: "Secure checkout", d: "Pay at our checkout when you order — crypto today, with bank transfer and JazzCash / EasyPaisa coming soon." },
  { t: "Revisions included", d: "Every plan includes rounds of point-by-point revisions. We change what you ask — nothing else." },
  { t: "Halal, always", d: "Sound effects only, never music. No imagery of women. You promise not to add music or anything impermissible later." },
];

const SECTIONS = [
  ["agreement", "The agreement"], ["orders", "Orders & briefs"], ["payment", "Payment"], ["delivery", "Delivery"],
  ["revisions", "Revisions"], ["ownership", "Ownership & licence"], ["your-materials", "Your materials"],
  ["ai", "How films are made"], ["portfolio", "Our portfolio"], ["content", "Content we don’t make"],
  ["refunds", "Cancellations & refunds"], ["liability", "Liability"], ["changes", "Changes & contact"],
] as const;

export default function Terms() {
  return (
    <>
      <DocHeader title="Terms of service." lede="Plain-language terms for every film we make. The short version first — the details follow." updated={TERMS_UPDATED} />
      <Glance label="At a glance" items={SHORT} />
      <div className={s.withToc}>
      <article className={s.prose}>
        <h2 id="agreement"><span className={s.num}>01</span>The agreement</h2>
        <p>These terms apply between <b>Harkat</b> (“we”, “us”) and the person or company ordering a film (“you”). By ticking “I accept the Terms” and placing an order, you agree to them. If you order for a company, you confirm you’re allowed to agree on its behalf.</p>

        <h2 id="orders"><span className={s.num}>02</span>Orders &amp; briefs</h2>
        <p>When you order and pay, we review your brief and reply by email to confirm scope and timeline. The agreement starts once we confirm. We may decline any order, with a full refund — for example, if it falls outside our <Link href="/docs/halal">content principles</Link>.</p>

        <h2 id="payment"><span className={s.num}>03</span>Payment</h2>
        <p>Prices are shown in US dollars and are the founding prices listed when you order. You pay when you order, at our secure checkout: <b>crypto</b> (USDT, USDC, BTC and more), processed by our partner NOWPayments. Bank transfer and JazzCash / EasyPaisa are coming soon. <b>Production starts when payment is received</b>. Prices exclude network or bank fees.</p>
        <p>If we can’t take on your brief, we refund you in full.</p>

        <h2 id="delivery"><span className={s.num}>04</span>Delivery</h2>
        <p>Delivery times (for example, “about 4 days”) are counted from the day payment is received and you’ve sent everything we need. They’re honest estimates, not guarantees; if something will slip, we tell you early. Films are delivered as one final MP4 in the format you chose (16:9 or 9:16), with its sound effects already mixed in. We don’t supply silent versions or separate audio tracks.</p>

        <h2 id="revisions"><span className={s.num}>05</span>Revisions</h2>
        <p>Each plan includes a set number of revision rounds. A round is one consolidated list of point-by-point notes on the latest draft. We change exactly what you ask. New ideas that change the brief itself — a different script, length or concept — count as new work and may be quoted separately.</p>

        <h2 id="ownership"><span className={s.num}>06</span>Ownership &amp; licence</h2>
        <p>When your order is paid in full, <b>you own the final film</b>. You can use it worldwide, forever, for any lawful purpose — ads, launches, social media, your website, pitch decks, events — and you can edit, cut, crop or re-caption it. You don’t need to credit us.</p>
        <p className={s.note}><b>One condition: no music, nothing impermissible.</b> When you order, you promise not to add music — or any content that is impermissible in Islam, such as images of women or indecent material — to the film or anything built from it. If you do, you lose the right to credit, tag or mention Harkat, we may ask you to take down the edited version, and we may decline future orders.</p>
        <ul>
          <li><b>Included:</b> the final rendered film, mixed with its sound effects, in the format you chose.</li>
          <li><b>Sound effects</b> in the film come from licensed libraries. You can use them as part of the film; you can’t extract and resell them separately.</li>
          <li><b>Project files</b> — the code and source we use to build the film — stay with us unless we agree otherwise in writing.</li>
          <li>Until payment is complete, drafts and previews remain ours and may not be published.</li>
        </ul>

        <h2 id="your-materials"><span className={s.num}>07</span>Your materials</h2>
        <p>Your logos, product UI, screenshots, names and brand colours stay yours. You confirm you have the right to let us use everything you send, and you give us permission to use it only to make your film. If a claim arises from materials you supplied, you’re responsible for it.</p>

        <h2 id="ai"><span className={s.num}>08</span>How films are made</h2>
        <p>Our films are <b>made with AI</b> — we work with advanced AI models and our own code-based motion tools — and every frame is directed, checked and finished by our team. Some films take inspiration from the pacing, transitions or style of existing motion design. We rebuild everything ourselves, never copy footage, and credit the work we reference on our <Link href="/docs/credits">credits page</Link>. More in <Link href="/docs/how-we-make-films">How we make films</Link>.</p>

        <h2 id="portfolio"><span className={s.num}>09</span>Our portfolio</h2>
        <p>We may show your finished film in our portfolio and social channels once it’s public. If your film needs to stay private, tell us when ordering and we won’t share it.</p>

        <h2 id="content"><span className={s.num}>10</span>Content we don’t make</h2>
        <p>Every film follows our <Link href="/docs/halal">halal principles</Link>: <b>sound effects only, never music</b>; <b>no imagery of women</b> (people appear as abstract avatars or initials); and only honest, halal products. We don’t make films for gambling, alcohol, interest-based lending, adult content, or anything misleading. Claims in your film must be true and yours to make.</p>

        <h2 id="refunds"><span className={s.num}>11</span>Cancellations &amp; refunds</h2>
        <ul>
          <li>Cancel any time <b>before production starts</b> for a full refund.</li>
          <li>If <b>we</b> decline your brief or can’t deliver, you get a full refund.</li>
          <li>Crypto refunds are sent in the same coin to an address you give us, minus network fees.</li>
          <li>Once the first draft is delivered, payment isn’t refundable — we’ll keep working through your included revisions until the film matches the confirmed brief.</li>
        </ul>

        <h2 id="liability"><span className={s.num}>12</span>Liability</h2>
        <p>We take care with every film, but we can’t be responsible for how a film performs or for indirect losses. Our total liability for any order is limited to the amount you paid for it.</p>

        <h2 id="changes"><span className={s.num}>13</span>Changes &amp; contact</h2>
        <p>We may update these terms; the version you accepted applies to your order. Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>

        <p className={s.note}>See also our <Link href="/docs/privacy">Privacy notice</Link> — what we collect when you order, and why.</p>
      </article>
      <Toc items={SECTIONS} />
      </div>
    </>
  );
}
