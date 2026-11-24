"use client";

import { useMemo, useState } from "react";
import { Mark } from "@/components/icons";
import { PLANS, planOf, type PlanKey } from "@/lib/order";
import { FILMS } from "@/lib/site";
import type { StoredOrder } from "@/lib/orders";
import s from "./admin.module.css";

const DAY = 86_400_000;
// Older orders stored the plan as "filmType".
const pk = (o: StoredOrder) => (o.plan ?? (o as unknown as { filmType?: string }).filmType ?? "") as string;
const price = (k: string) => planOf(k)?.price ?? 0;
const typeName = (k: string) => planOf(k)?.name ?? k;
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const localDate = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); };
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function daysLeft(deadline: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((localDate(deadline).getTime() - today.getTime()) / DAY);
}

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : fmtDate(new Date(iso));
}

function Due({ deadline }: { deadline: string }) {
  const n = daysLeft(deadline);
  const [cls, label] =
    n < 0 ? [s.late, `${-n}d overdue`] : n === 0 ? [s.soon, "Due today"] : n <= 3 ? [s.soon, `${n}d left`] : [s.ok, `${n}d left`];
  return (
    <span className={s.due}>
      <span>{fmtDate(localDate(deadline))}</span>
      <span className={`${s.badge} ${cls}`}>{label}</span>
    </span>
  );
}

type Sort = "new" | "deadline";

export default function Dashboard({ orders, cryptoReady }: { orders: StoredOrder[]; cryptoReady: boolean }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<PlanKey | "all">("all");
  const [sort, setSort] = useState<Sort>("new");
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Crypto payment links created this session (saved links come with the order).
  const [links, setLinks] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<Record<string, string>>({});

  const makeLink = async (id: string) => {
    setPaying(id);
    setPayErr((e) => ({ ...e, [id]: "" }));
    const res = await fetch("/api/admin/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && j.url) setLinks((l) => ({ ...l, [id]: j.url }));
    else setPayErr((e) => ({ ...e, [id]: j.error ?? "Couldn’t create the link." }));
    setPaying(null);
  };

  const [openedAt] = useState(() => Date.now());
  const stats = useMemo(() => {
    const week = openedAt - 7 * DAY;
    return {
      total: orders.length,
      value: orders.reduce((n, o) => n + price(pk(o)), 0),
      dueSoon: orders.filter((o) => { const d = daysLeft(o.deadline); return d >= 0 && d <= 7; }).length,
      newWeek: orders.filter((o) => new Date(o.createdAt).getTime() >= week).length,
    };
  }, [orders, openedAt]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = orders.filter(
      (o) =>
        (type === "all" || pk(o) === type) &&
        (!needle || [o.name, o.email, o.productName ?? "", o.productUrl, o.referenceUrl ?? ""].some((v) => v.toLowerCase().includes(needle)))
    );
    return sort === "deadline" ? [...list].sort((a, b) => a.deadline.localeCompare(b.deadline)) : list;
  }, [orders, q, type, sort]);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className={s.page}>
      <header className={s.bar}>
        <span className={s.brand}><Mark size={22} /> harkat <span className={s.tag}>admin</span></span>
        <form action="/api/admin/logout" method="post"><button className={s.ghost}>Sign out</button></form>
      </header>

      <div className={s.hero}>
        <h1 className={s.h1}>Orders</h1>
        <p className={s.sub}>Every request from the order box, newest first.</p>
      </div>

      <div className={s.stats}>
        <div className={s.stat}><span className={s.statLabel}>Total orders</span><span className={s.statNum}>{stats.total}</span></div>
        <div className={s.stat}><span className={s.statLabel}>Pipeline value</span><span className={s.statNum}>{money(stats.value)}</span></div>
        <div className={s.stat}><span className={s.statLabel}>Due in 7 days</span><span className={s.statNum}>{stats.dueSoon}</span></div>
        <div className={s.stat}><span className={s.statLabel}>New this week</span><span className={`${s.statNum} ${s.blue}`}>{stats.newWeek}</span></div>
      </div>

      <div className={s.toolbar}>
        <label className={s.search}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input placeholder="Search name, email or product" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        </label>
        <div className={s.seg} role="group" aria-label="Film type">
          {([["all", "All"], ...PLANS.map((t) => [t.key, t.name])] as [PlanKey | "all", string][]).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)}>{label}</button>
          ))}
        </div>
        <div className={s.seg} role="group" aria-label="Sort">
          <button type="button" aria-pressed={sort === "new"} onClick={() => setSort("new")}>Newest</button>
          <button type="button" aria-pressed={sort === "deadline"} onClick={() => setSort("deadline")}>Deadline</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}><Mark size={26} /></span>
          <b>No orders yet</b>
          <span>New orders from the site will show up here.</span>
        </div>
      ) : shown.length === 0 ? (
        <div className={s.empty}><b>No matches</b><span>Try a different search or filter.</span></div>
      ) : (
        <div className={s.list}>
          <div className={`${s.row} ${s.head}`} aria-hidden="true">
            <span>Client</span><span>Product</span><span>Film</span><span>Deadline</span><span>Received</span>
          </div>
          {shown.map((o) => {
            const isOpen = open === o.id;
            return (
              <div key={o.id} className={`${s.item} ${isOpen ? s.open : ""}`}>
                <button type="button" className={s.row} onClick={() => setOpen(isOpen ? null : o.id)} aria-expanded={isOpen}>
                  <span className={s.client}>
                    <span className={s.avatar} aria-hidden="true">{initials(o.name)}</span>
                    <span className={s.who}><b>{o.name}</b><span>{o.email}</span></span>
                  </span>
                  <span className={s.who}><b>{o.productName ?? host(o.productUrl)}</b><span>{host(o.productUrl)}</span></span>
                  <span><span className={s.pill}>{typeName(pk(o))}</span> <span className={s.cellMuted}>{money(price(pk(o)))}</span>{o.status === "paid" && <> <span className={s.paid}>Paid</span></>}</span>
                  <Due deadline={o.deadline} />
                  <span className={s.cellMuted} suppressHydrationWarning>{ago(o.createdAt)}</span>
                </button>
                {isOpen && (
                  <div className={s.detail}>
                    <dl className={s.dl}>
                      <div><dt>Product</dt><dd><a href={o.productUrl} target="_blank" rel="noopener noreferrer">{o.productUrl}</a></dd></div>
                      {o.productType && <div><dt>Product type</dt><dd>{o.productType}</dd></div>}
                      {o.purpose && <div><dt>Film for</dt><dd>{o.purpose}</dd></div>}
                      {o.pitch && <div><dt>One-liner</dt><dd>{o.pitch}</dd></div>}
                      {o.ratio && <div><dt>Format</dt><dd>{o.ratio}</dd></div>}
                      {o.style && <div><dt>Look</dt><dd>{FILMS.find((f) => f.slug === o.style)?.title ?? o.style}</dd></div>}
                      {o.colors?.length ? <div><dt>Colours</dt><dd className={s.swatches}>{o.colors.map((c) => <span key={c}><i style={{ background: c }} />{c}</span>)}</dd></div> : null}
                      {o.notes && <div className={s.wide}><dt>Notes</dt><dd>{o.notes}</dd></div>}
                      {o.pledge && <div><dt>No-music pledge</dt><dd>Confirmed</dd></div>}
                      {o.termsAccepted && <div><dt>Terms accepted</dt><dd>Version {o.termsAccepted}</dd></div>}
                      <div><dt>Status</dt><dd>{o.status === "paid" ? `Paid${o.payment?.payCurrency ? ` in ${o.payment.payCurrency}` : ""}${o.payment?.paidAt ? ` · ${new Date(o.payment.paidAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}` : o.status === "awaiting-payment" ? (o.payment?.status && o.payment.status !== "waiting" ? `Awaiting payment (crypto: ${o.payment.status.replace(/_/g, " ")})` : "Awaiting payment") : o.status ?? "—"}</dd></div>
                      <div><dt>Reference</dt><dd>{o.referenceUrl ? <a href={o.referenceUrl} target="_blank" rel="noopener noreferrer">{o.referenceUrl}</a> : "—"}</dd></div>
                      <div><dt>Received</dt><dd>{new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</dd></div>
                      <div><dt>Order ID</dt><dd className={s.mono}>{o.id}</dd></div>
                    </dl>
                    {(() => {
                      const link = links[o.id] ?? o.payment?.invoiceUrl;
                      if (o.status === "paid") return null;
                      return (
                        <div className={s.pay}>
                          {link ? (
                            <>
                              <span className={s.payLink}><b>Crypto payment link</b><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></span>
                              <button type="button" className={s.ghost} onClick={() => copy(link, `pay-${o.id}`)}>{copied === `pay-${o.id}` ? "Copied ✓" : "Copy link"}</button>
                            </>
                          ) : (
                            <>
                              <span className={s.payLink}><b>Payment</b><span>{cryptoReady ? "Confirm the brief, then create a crypto payment link. The order is marked paid automatically." : "Add the NOWPayments keys in Vercel to enable crypto payment links."}</span></span>
                              <button type="button" className={s.ghost} disabled={!cryptoReady || paying === o.id} onClick={() => makeLink(o.id)}>{paying === o.id ? "Creating…" : "Create payment link"}</button>
                            </>
                          )}
                          {payErr[o.id] && <span className={s.payErr}>{payErr[o.id]}</span>}
                        </div>
                      );
                    })()}
                    <div className={s.actions}>
                      <a className={s.primary} href={`mailto:${o.email}?subject=${encodeURIComponent(`Your ${typeName(pk(o))} film with Harkat`)}${(links[o.id] ?? o.payment?.invoiceUrl) && o.status !== "paid" ? `&body=${encodeURIComponent(`Assalamu alaikum ${o.name.split(" ")[0]},

Your brief is confirmed. You can pay securely here:
${links[o.id] ?? o.payment?.invoiceUrl}

We start as soon as it’s paid.

Harkat`)}` : ""}`}>Reply by email</a>
                      <button type="button" className={s.ghost} onClick={() => copy(o.email, o.id)}>{copied === o.id ? "Copied ✓" : "Copy email"}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
