"use client";

import { useEffect, useRef, useState } from "react";
import Calendar, { formatDue, ymd } from "./Calendar";
import Captcha from "./Captcha";
import PayBox from "./PayBox";
import { Arrow, Mark } from "./icons";
import { CONTACT_EMAIL, FILMS, filmLoop, filmPoster } from "@/lib/site";
import { PRODUCT_TYPES, PURPOSES, RATIOS, planOf, validate, type Order, type PlanKey, type Ratio } from "@/lib/order";
import s from "./OrderFlow.module.css";

export type OrderSummary = { name: string; email: string; plan: PlanKey; deadline: string };

type Form = {
  productName: string; productUrl: string; productType: string; purpose: string; ratio: Ratio; style: string;
  referenceUrl: string; deadline: string; name: string; email: string; notes: string; company: string;
  pitch: string; colors: string[];
};
type Field = keyof Form;

const QUICK = [["In a week", 7], ["In two weeks", 14], ["In a month", 30]] as const;
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const domainOf = (v: string) => v.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
const shortDate = (v: string) => new Date(v + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

// One calm screen: the essentials on the left (extras fold away), a live order card on the right.
export default function OrderFlow({ plan, onChangePlan, onClose, onDone }: {
  plan: PlanKey; onChangePlan: () => void; onClose: () => void; onDone: (o: OrderSummary) => void;
}) {
  const p = planOf(plan)!;
  const [f, setF] = useState<Form>({ productName: "", productUrl: "", productType: "", purpose: "", ratio: "16:9", style: "", referenceUrl: "", deadline: "", name: "", email: "", notes: "", company: "", pitch: "", colors: [] });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formErr, setFormErr] = useState("");
  const [calOpen, setCalOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [looksOpen, setLooksOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // The calendar floats over the form; a click anywhere else or Esc closes it.
  useEffect(() => {
    if (!calOpen) return;
    const away = (e: PointerEvent) => { if (!calRef.current?.contains(e.target as Node)) setCalOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); setCalOpen(false); } };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc, true); };
  }, [calOpen]);

  // A studio preview can hand its brief across. Filled once, after mount, and only into empty fields.
  // sessionStorage is unavailable during server render, so this cannot live in the initial state.
  useEffect(() => {
    let brief: { name?: string; url?: string; notes?: string; problem?: string; accent?: string } | null = null;
    try {
      const raw = sessionStorage.getItem("harkat.studioBrief");
      if (!raw) return;
      brief = JSON.parse(raw) as { name?: string; url?: string; notes?: string; problem?: string; accent?: string };
    } catch { /* a bad saved brief should not block the order form */ return; }
    const b = brief;
    const accent = /^#[0-9a-fA-F]{6}$/.test(b.accent ?? "") ? b.accent!.toUpperCase() : "";
    queueMicrotask(() => {
      setF((prev) => ({
        ...prev,
        productName: prev.productName || b.name || "",
        productUrl: prev.productUrl || b.url || "",
        notes: prev.notes || b.notes || "",
        pitch: prev.pitch || (b.problem ?? "").slice(0, 200),
        colors: prev.colors.length ? prev.colors : accent ? [accent] : [],
      }));
      if (b.notes) setMore(true);
    });
  }, []);
  const [human, setHuman] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [pledged, setPledged] = useState(false);
  // The order is saved first, then paid in the pay box. Reopening reuses it (unless the plan changed).
  const [placed, setPlaced] = useState<{ id: string; token: string; plan: PlanKey } | null>(null);
  const [paying, setPaying] = useState(false);
  const [sending, setSending] = useState(false);

  const set = <K extends Field>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); setFormErr(""); };
  const toggle = (k: "productType" | "purpose" | "style", v: string) => set(k, f[k] === v ? "" : v);
  const look = FILMS.find((x) => x.slug === f.style);
  const custom = !!f.deadline && !QUICK.some(([, n]) => inDays(n) === f.deadline);
  const product = f.productName.trim(), site = domainOf(f.productUrl);
  const initials = product.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  // Their site icon (via /api/favicon), once the address looks complete; initials if there’s no good one.
  const [logoSite, setLogoSite] = useState("");
  const [logoOk, setLogoOk] = useState<boolean | null>(null);
  useEffect(() => {
    const d = site.split("/")[0].toLowerCase();
    const t = setTimeout(() => { if (d !== logoSite) { setLogoSite(/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d) ? d : ""); setLogoOk(null); } }, 500);
    return () => clearTimeout(t);
  }, [site, logoSite]);

  const submit = async () => {
    const all = validate({
      ...f, plan,
      productType: f.productType || undefined, purpose: f.purpose || undefined,
      referenceUrl: f.referenceUrl || undefined, notes: f.notes || undefined,
    } as Partial<Order>) as Partial<Record<Field, string>>;
    const bad = Object.fromEntries(Object.entries(all).filter(([, m]) => m)) as Partial<Record<Field, string>>;
    if (Object.keys(bad).length) {
      setErrors(bad);
      if (bad.deadline) setCalOpen(true);
      if (bad.referenceUrl || bad.notes) setMore(true);
      document.querySelector(`[data-field="${Object.keys(bad)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!pledged) return setFormErr("Please confirm you won’t add music or anything impermissible.");
    if (!accepted) return setFormErr("Please accept the Terms to continue.");
    if (placed && placed.plan === plan) return setPaying(true);
    if (!human) return setFormErr("Please tick “I’m not a robot” first.");
    setSending(true);
    setFormErr("");
    try {
      const res = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, plan, acceptTerms: accepted, pledge: pledged, altcha: human }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.payToken) { setPlaced({ id: data.id, token: data.payToken, plan }); setPaying(true); return; }
      if (res.ok) return onDone({ name: f.name.trim(), email: f.email.trim(), plan, deadline: f.deadline });
      if (data.errors) setErrors(data.errors);
      else setFormErr(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormErr("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const err = (k: Field) => errors[k] && <span className={s.err}>{errors[k]}</span>;

  return (
    <div className={s.flow}>
      <div className={s.glow} aria-hidden="true" />
      <header className={s.top}>
        <span className={s.brand}><Mark size={22} />harkat</span>
        <button type="button" className={s.close} onClick={onClose} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </header>

      <div className={s.layout}>
        <form className={s.form} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          <h2 id="order-title" className={s.h1}>Tell us about your film.</h2>

          <div className={s.block}>
            <span className={s.bh}>Your product</span>
            <div className={s.row}>
              <label className={s.field} data-field="productName">
                <input className={s.input} value={f.productName} onChange={(e) => set("productName", e.target.value)} placeholder="Product name" maxLength={80} autoComplete="organization" aria-label="Product name" aria-invalid={!!errors.productName} />
                {err("productName")}
              </label>
              <label className={s.field} data-field="productUrl">
                <input className={s.input} type="url" inputMode="url" value={f.productUrl} onChange={(e) => set("productUrl", e.target.value)} placeholder="yourproduct.com" maxLength={300} aria-label="Product link" aria-invalid={!!errors.productUrl} />
                {err("productUrl")}
              </label>
            </div>
          </div>

          <div className={`${s.block} ${s.inline}`}>
            <span className={s.bh}>Format</span>
            <div className={s.ratios} role="radiogroup" aria-label="Format">
              {RATIOS.map(([r, label]) => (
                <button key={r} type="button" role="radio" aria-checked={f.ratio === r} className={`${s.ratio} ${f.ratio === r ? s.on : ""}`} onClick={() => set("ratio", r)}>
                  <i className={r === "9:16" ? s.tall : s.wide} aria-hidden="true" />
                  <b>{label}</b>
                  <small>{r}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={`${s.block} ${s.fold} ${looksOpen ? s.foldOpen : ""}`}>
            <button type="button" className={s.foldBtn} aria-expanded={looksOpen} onClick={() => setLooksOpen((o) => !o)}>
              <span className={s.bh}>Pick a look <em>Optional</em></span>
              {look && <span className={s.foldPick}>{look.short}</span>}
              <svg className={s.chev} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className={s.foldPanel}>
              <div className={s.foldInner}>
                <div className={s.looks}>
                  {FILMS.map((film) => {
                    const on = f.style === film.slug;
                    return (
                      <button key={film.slug} type="button" className={`${s.look} ${on ? s.on : ""}`} aria-pressed={on} onClick={() => toggle("style", film.slug)}
                        onMouseEnter={(e) => { e.currentTarget.querySelector("video")?.play().catch(() => {}); }}
                        onMouseLeave={(e) => { const vid = e.currentTarget.querySelector("video"); if (vid) { vid.pause(); vid.currentTime = 0; } }}>
                        <span className={s.lookThumb}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={filmPoster(film.slug)} alt="" loading="lazy" decoding="async" />
                          <video src={filmLoop(film.slug)} muted loop playsInline preload="none" aria-hidden="true" />
                          <span className={s.lookCheck} aria-hidden="true">
                            <svg width="11" height="11" viewBox="0 0 22 22"><path d="M5 11.5 L9 15.5 L17 7" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        </span>
                        <span className={s.lookName}>{film.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={s.block} data-field="deadline">
            <span className={s.bh}>Deadline</span>
            <div className={s.dates} ref={calRef}>
              <button type="button" className={`${s.pickDate} ${calOpen || custom ? s.on : ""}`} aria-expanded={calOpen} onClick={() => setCalOpen((o) => !o)}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M2 6.5 H14 M5.5 1.5 V4 M10.5 1.5 V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                <span>{custom ? formatDue(f.deadline) : "Pick a date"}</span>
              </button>
              {QUICK.map(([label, n]) => {
                const d = inDays(n), on = f.deadline === d;
                return (
                  <button key={label} type="button" className={`${s.quick} ${on ? s.on : ""}`} aria-pressed={on} onClick={() => { set("deadline", d); setCalOpen(false); }}>
                    <b>{label}</b>
                    <small>{shortDate(d)}</small>
                  </button>
                );
              })}
              {calOpen && <div className={s.cal} role="dialog" aria-label="Pick a date"><Calendar value={f.deadline} onChange={(d) => { set("deadline", d); setCalOpen(false); }} invalid={!!errors.deadline} /></div>}
            </div>
            {err("deadline")}
          </div>

          <div className={s.block}>
            <span className={s.bh}>You</span>
            <div className={s.row}>
              <label className={s.field} data-field="name">
                <input className={s.input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" maxLength={100} autoComplete="name" aria-label="Your name" aria-invalid={!!errors.name} />
                {err("name")}
              </label>
              <label className={s.field} data-field="email">
                <input className={s.input} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" maxLength={200} autoComplete="email" aria-label="Email" aria-invalid={!!errors.email} />
                {err("email")}
              </label>
            </div>
          </div>

          <div className={`${s.more} ${more ? s.moreOpen : ""}`}>
            <button type="button" className={s.moreBtn} aria-expanded={more} onClick={() => setMore((m) => !m)}>
              <span className={s.plus} aria-hidden="true" />Add more details <em>Optional</em>
            </button>
            <div className={s.morePanel}>
              <div className={s.moreInner}>
                <div className={s.field}>
                  <span className={s.label}>What kind of product?</span>
                  <div className={s.chips}>
                    {PRODUCT_TYPES.map((o) => <button key={o} type="button" className={`${s.chip} ${f.productType === o ? s.on : ""}`} aria-pressed={f.productType === o} onClick={() => toggle("productType", o)}>{o}</button>)}
                  </div>
                </div>
                <div className={s.field}>
                  <span className={s.label}>What’s it for?</span>
                  <div className={s.chips}>
                    {PURPOSES.map((o) => <button key={o} type="button" className={`${s.chip} ${f.purpose === o ? s.on : ""}`} aria-pressed={f.purpose === o} onClick={() => toggle("purpose", o)}>{o}</button>)}
                  </div>
                </div>
                <label className={s.field}>
                  <span className={s.label}>A film you love</span>
                  <input className={s.input} type="url" inputMode="url" value={f.referenceUrl} onChange={(e) => set("referenceUrl", e.target.value)} placeholder="Paste a link" maxLength={300} aria-invalid={!!errors.referenceUrl} />
                  {err("referenceUrl")}
                </label>
                <label className={s.field}>
                  <span className={s.label}>Anything else?</span>
                  <textarea className={`${s.input} ${s.area}`} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Tone, must-have features, things to avoid…" maxLength={1500} rows={3} />
                </label>
              </div>
            </div>
          </div>
          {/* honeypot */}
          <input className={s.hp} tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.company} onChange={(e) => set("company", e.target.value)} name="company" />
        </form>

        <aside className={s.card} aria-label="Your order">
          <div className={s.orderHead}>
            <span><small>Your order</small><b>{p.name} film</b></span>
            <button type="button" className={s.change} onClick={onChangePlan}>Change plan</button>
          </div>

          {/* A live title card for their film: their logo and name, their site along the bottom */}
          <div className={`${s.preview} ${look ? s.onPoster : ""}`}>
            {look && (<>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={look.slug} className={s.poster} src={filmPoster(look.slug)} alt="" />
            </>)}
            <div className={s.slate}>
              <span key={logoSite || initials} className={`${s.logo} ${product ? "" : s.ghost}`}>
                {logoSite && logoOk !== false ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/favicon?d=${encodeURIComponent(logoSite)}`} alt="" onLoad={(e) => setLogoOk(e.currentTarget.naturalWidth >= 48)} onError={() => setLogoOk(false)} style={{ opacity: logoOk ? 1 : 0 }} />
                ) : null}
                {(!logoSite || logoOk !== true) && (product ? <em>{initials}</em> : <Mark size={22} />)}
              </span>
              <b className={`${s.pvName} ${product ? "" : s.ghost}`}>{product || "Your product"}</b>
            </div>
            <span className={`${s.pvSite} ${site ? "" : s.ghost}`}>{site || "yourproduct.com"}</span>
          </div>

          <dl className={s.lines}>
            <div><dt>Film</dt><dd>{p.length} · {f.ratio}</dd></div>
            <div><dt>Delivery</dt><dd>About {p.delivery}</dd></div>
            <div><dt>Deadline</dt><dd>{f.deadline ? formatDue(f.deadline) : "—"}</dd></div>
          </dl>

          <div className={s.total}>
            <span>Total <small>· secure checkout</small></span>
            <b key={p.price} className={s.price}>${p.price}</b>
          </div>

          <label className={`${s.terms} ${pledged ? s.termsOn : ""}`}>
            <input type="checkbox" checked={pledged} onChange={(e) => { setPledged(e.target.checked); setFormErr(""); }} />
            <span className={s.box} aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 22 22"><path d="M5 11.5 L9 15.5 L17 7" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>I won’t add music, or anything impermissible, to this film. <a href="/docs/terms#ownership" target="_blank" rel="noopener">Why</a></span>
          </label>
          <label className={`${s.terms} ${accepted ? s.termsOn : ""}`}>
            <input type="checkbox" checked={accepted} onChange={(e) => { setAccepted(e.target.checked); setFormErr(""); }} />
            <span className={s.box} aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 22 22"><path d="M5 11.5 L9 15.5 L17 7" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span>I accept the <a href="/docs/terms" target="_blank" rel="noopener">Terms</a> and <a href="/docs/privacy" target="_blank" rel="noopener">Privacy</a>.</span>
          </label>
          <Captcha dark onChange={(c) => { setHuman(c); setFormErr(""); }} />
          {formErr && <p className={s.err} role="alert">{formErr}{/email us/i.test(formErr) && <> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></>}</p>}
          <button type="button" className={`btn ${s.primary}`} onClick={submit} disabled={sending}>
            <span className={s.btnLabel}>{sending ? "One moment…" : `Pay $${p.price}`}</span>
            <span className={`key ${s.key}`}><Arrow /></span>
          </button>
        </aside>
      </div>
      {paying && placed && (
        <PayBox
          orderId={placed.id}
          token={placed.token}
          price={planOf(placed.plan)!.price}
          plan={planOf(placed.plan)!.name}
          onClose={() => setPaying(false)}
          onPaid={() => onDone({ name: f.name.trim(), email: f.email.trim(), plan: placed.plan, deadline: f.deadline })}
        />
      )}
    </div>
  );
}
