const BLADE = "M-5 -11 C -5 -26, 3 -39, 15 -46 C 10 -34, 6 -23, 5 -11 A 5 5 0 0 1 -5 -11 Z";

export function Mark({ size, fill = "#2E4BDB", className }: { size: number; fill?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" className={className}>
      <g fill={fill}>
        {[0, 72, 144, 216, 288].map((r) => (
          <path key={r} d={BLADE} transform={r ? `rotate(${r})` : undefined} />
        ))}
      </g>
    </svg>
  );
}

export function Arrow({ stroke = "#FFFFFF" }: { stroke?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6 H10 M6.5 2.5 L10 6 L6.5 9.5" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Play() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.5 L10 6 L3 10.5 Z" fill="#FFFFFF" />
    </svg>
  );
}

export function Envelope() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
      <path d="M2 4.5 L8 9 L14 4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// Grainy overlay: SVG feTurbulence, soft-light at 0.5 opacity.
export function Grain({ id }: { id: string }) {
  return (
    <svg className="grain" width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "soft-light", opacity: 0.5 }} aria-hidden="true">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
