"use client";

import { useEffect, useRef, useState } from "react";
import CoinLogo from "./CoinLogo";
import { CONTACT_EMAIL } from "@/lib/site";
import s from "./PayBox.module.css";

type Step = "method" | "crypto" | "paid";

const BANK = <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 7.5 L10 3 L17.5 7.5 Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M4.5 9.5 V14.5 M8.2 9.5 V14.5 M11.8 9.5 V14.5 M15.5 9.5 V14.5 M2.5 17 H17.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
const PHONE = <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="5.5" y="2" width="9" height="16" rx="2.2" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="1.4" /><path d="M8.6 15.2 H11.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M8 7.8 L9.6 9.4 L12.4 6.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const CHEV = <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 L8 6 L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const SOON = [["bank", "Bank transfer", "Direct to our bank account", BANK], ["wallet", "JazzCash / EasyPaisa", "Mobile wallets in Pakistan", PHONE]] as const;

// Checkout box over the order form. Crypto opens NOWPayments' own checkout right inside the box;
// their webhook marks the order paid and this box notices. Bank and mobile wallets are coming soon.
export default function PayBox({ orderId, token, price, plan, onClose, onPaid }: { orderId: string; token: string; price: number; plan: string; onClose: () => void; onPaid: () => void }) {
  const [step, setStep] = useState<Step>("method");
  const [soon, setSoon] = useState<string | null>(null);
  const [iid, setIid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);

  // Esc closes only this box, not the order form behind it.
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", esc, true);
    box.current?.focus();
    return () => document.removeEventListener("keydown", esc, true);
  }, [onClose]);

  // While the checkout is open, watch for the webhook marking the order paid.
  useEffect(() => {
    if (step !== "crypto") return;
    let alive = true;
    const t = setInterval(async () => {
      const r = await fetch(`/api/pay/status?id=${orderId}&token=${encodeURIComponent(token)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? await r.json().catch(() => null) : null;
      if (alive && j?.paid) setStep("paid");
    }, 6000);
    return () => { alive = false; clearInterval(t); };
  }, [step, orderId, token]);

  const openCrypto = async () => {
    setSoon(null);
    setErr("");
    if (iid) return setStep("crypto");
    setBusy(true);
    const r = await fetch("/api/pay/invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: orderId, token }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (j.paid) return setStep("paid");
    if (!r?.ok || !j.iid) return setErr(j.error ?? "Network error. Please try again.");
    setIid(j.iid);
    setLoaded(false);
    setStep("crypto");
  };

  return (
    <div className={s.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget && step !== "paid") onClose(); }}>
      <div ref={box} className={`${s.box} ${step === "crypto" ? s.wide : ""}`} role="dialog" aria-modal="true" aria-label="Payment" tabIndex={-1}>
        <header className={s.head}>
          {step === "crypto" ? (
            <button type="button" className={s.icon} onClick={() => setStep("method")} aria-label="Back">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 L4 6 L7.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : <span className={s.lock} aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12"><rect x="2.2" y="5.2" width="7.6" height="5.6" rx="1.4" fill="currentColor" /><path d="M3.9 5.2 V3.9 a2.1 2.1 0 0 1 4.2 0 V5.2" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg></span>}
          <div className={s.title}>
            <b>{step === "paid" ? "Payment received" : "Checkout"}</b>
            <span>Harkat · {plan} film</span>
          </div>
          {step !== "paid" && <span className={s.total}>${price}<small>USD</small></span>}
          {step !== "paid" && (
            <button type="button" className={s.icon} onClick={onClose} aria-label="Close">
              <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          )}
        </header>

        {step === "method" && (
          <div key="method" className={s.body}>
            <span className={s.label}>Payment method</span>
            <div className={s.rows}>
              <button type="button" className={`${s.row} ${s.main}`} onClick={openCrypto} disabled={busy}>
                <span className={s.coinMark} aria-hidden="true"><CoinLogo coin={{ logo: "usdc", badge: "base" }} size={42} /></span>
                <span className={s.rowText}>
                  <b>USDC <em>on Base</em></b>
                  <small>Stablecoin · 1 USDC = $1 · pay from any wallet</small>
                </span>
                {busy ? <span className={s.spin} aria-label="Opening checkout" /> : <span className={s.chev}>{CHEV}</span>}
              </button>
              {SOON.map(([k, t, d, g]) => (
                <button key={k} type="button" className={`${s.row} ${s.dim}`} onClick={() => setSoon(k)} aria-describedby={soon === k ? "soon-note" : undefined}>
                  <span className={s.tile}>{g}</span>
                  <span className={s.rowText}><b>{t}</b><small>{d}</small></span>
                  <span className={s.soonChip}>Soon</span>
                </button>
              ))}
            </div>
            {err && <p className={s.err} role="alert">{err}</p>}
            {soon && <p id="soon-note" className={s.note}>We’re setting this up. For now, pay with crypto — or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we’ll help.</p>}
          </div>
        )}

        {step === "crypto" && iid && (
          <div key="crypto" className={s.frameWrap}>
            {!loaded && <span className={s.frameLoading}><span className={s.spin} />Opening secure checkout…</span>}
            <iframe
              className={s.frame}
              src={`https://nowpayments.io/embeds/payment-widget?iid=${encodeURIComponent(iid)}`}
              title="NOWPayments checkout"
              onLoad={() => setLoaded(true)}
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </div>
        )}

        {step === "paid" && (
          <div key="paid" className={`${s.body} ${s.done}`}>
            <span className={s.tick} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 22 22"><path d="M5 11.5 L9 15.5 L17 7" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <b>JazakAllahu khayran.</b>
            <p>Your payment is confirmed. We’ll start on your film and email you shortly.</p>
            <button type="button" className={`btn ${s.cont}`} onClick={onPaid}>Continue</button>
          </div>
        )}

        {step !== "crypto" && (
          <footer className={s.foot}>
            <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.2" y="5.2" width="7.6" height="5.6" rx="1.4" fill="currentColor" /><path d="M3.9 5.2 V3.9 a2.1 2.1 0 0 1 4.2 0 V5.2" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
            Secure checkout · Powered by <b>NOWPayments</b>
          </footer>
        )}
      </div>
    </div>
  );
}
