"use client";

import { useEffect, useRef } from "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "altcha-widget": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        challenge?: string;
        name?: string;
        type?: string;
        auto?: string;
        configuration?: string;
      };
    }
  }
}

// "I'm not a robot" — self-hosted ALTCHA proof-of-work checkbox. Calls onChange with the
// signed payload once solved (or null if it resets / expires).
export default function Captcha({ onChange, dark }: { onChange: (payload: string | null) => void; dark?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const cb = useRef(onChange);

  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let alive = true;
    import("altcha").then(() => {
      const el = ref.current;
      if (!alive || !el) return;
      const onState = (e: Event) => {
        const d = (e as CustomEvent<{ state: string; payload?: string }>).detail;
        cb.current(d.state === "verified" && d.payload ? d.payload : null);
      };
      el.addEventListener("statechange", onState);
    });
    return () => { alive = false; };
  }, []);

  return (
    <altcha-widget
      ref={ref}
      challenge="/api/altcha"
      type="checkbox"
      configuration={JSON.stringify({ hideLogo: true, hideFooter: true })}
      style={{
        // brand the widget
        ["--altcha-max-width" as string]: "100%",
        ["--altcha-border-radius" as string]: "12px",
        ["--altcha-border-color" as string]: dark ? "rgba(255,255,255,0.2)" : "#E2E5EC",
        ["--altcha-color-base" as string]: dark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
        ["--altcha-color-base-content" as string]: dark ? "#FFFFFF" : "#0D1222",
        ["--altcha-color-neutral" as string]: dark ? "rgba(255,255,255,0.5)" : "#C5CBD8",
        ["--altcha-color-primary" as string]: dark ? "#8EA2FF" : "#2E4BDB",
        ["--altcha-color-error" as string]: dark ? "#FFB59E" : "#C2410C",
      }}
    />
  );
}
