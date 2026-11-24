"use client";

import { useEffect, useRef, useState } from "react";
import PlanPicker from "./PlanPicker";
import OrderFlow, { type OrderSummary } from "./OrderFlow";
import OrderSuccess from "./OrderSuccess";
import { Grain } from "./icons";
import type { PlanKey } from "@/lib/order";
import s from "./OrderModal.module.css";

type Phase = "plans" | "flow" | "done";

// Opens from any link to "#order" (every "Order a film" / "Start your film" button) on any page.
// Plans box → full-screen question flow → success.
export default function OrderModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("plans");
  const [plan, setPlan] = useState<PlanKey | undefined>();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [run, setRun] = useState(0); // remounts the flow for a fresh order

  // Browser history: the box (#order) and the form each get their own entry, so Back steps
  // form → plans → page instead of leaving the page underneath. depth = entries we pushed.
  const depth = useRef(0);
  const phaseRef = useRef<Phase>("plans");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const d = ref.current!;
    const open = (push: boolean) => {
      if (d.open) return;
      if (push && location.hash !== "#order") { history.pushState(history.state, "", location.pathname + location.search + "#order"); depth.current = 1; }
      setPhase("plans");
      setOrder(null);
      setRun((n) => n + 1);
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href="#order"]');
      if (!a) return;
      e.preventDefault();
      open(true);
    };
    const onClose = () => {
      document.documentElement.style.overflow = "";
      if (location.hash !== "#order") return;
      if (depth.current > 0) { const n = depth.current; depth.current = 0; history.go(-n); }
      else history.replaceState(history.state, "", location.pathname + location.search);
    };
    const onPop = () => {
      if (!d.open) { if (location.hash === "#order") { open(false); depth.current = 1; } return; }
      if (location.hash !== "#order") { depth.current = 0; d.close(); return; }
      if (history.state?.harkatOrder === "flow") return;
      depth.current = 1;
      if (phaseRef.current === "flow") setPhase("plans");
      else if (phaseRef.current === "done") d.close();
    };
    document.addEventListener("click", onClick);
    d.addEventListener("close", onClose);
    addEventListener("popstate", onPop);
    if (location.hash === "#order") open(false);
    return () => { document.removeEventListener("click", onClick); d.removeEventListener("close", onClose); removeEventListener("popstate", onPop); };
  }, []);

  const close = () => ref.current?.close();
  const pick = (k: PlanKey) => {
    setPlan(k);
    setPhase("flow");
    if (history.state?.harkatOrder !== "flow") { history.pushState({ ...history.state, harkatOrder: "flow" }, "", location.href); depth.current += 1; }
  };
  const onBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (phase === "plans" && e.target === e.currentTarget) close();
  };

  return (
    <dialog ref={ref} className={`${s.dialog} ${phase !== "plans" ? s.full : ""}`} onClick={onBackdrop} aria-labelledby="order-title">
      {phase === "plans" && (
        <div className={s.box}>
          <Grain id="gorder" />
          <button type="button" className={s.close} onClick={close} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <PlanPicker current={plan} onPick={pick} />
        </div>
      )}
      {/* Stays mounted (hidden) while the plan is being changed, so answers aren’t lost. */}
      {plan && phase !== "done" && (
        <div hidden={phase === "plans"}>
          <OrderFlow
            key={run}
            plan={plan}
            onChangePlan={() => setPhase("plans")}
            onClose={close}
            onDone={(o) => { setOrder(o); setPhase("done"); }}
          />
        </div>
      )}
      {phase === "done" && order && <OrderSuccess order={order} onDone={close} />}
    </dialog>
  );
}
