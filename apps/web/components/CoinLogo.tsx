// Coin marks drawn as inline SVG (no network requests), with a small network badge.
const LOGOS: Record<string, React.ReactNode> = {
  usdc: (
    <>
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path d="M11.2 9.2 A8.6 8.6 0 0 0 11.2 22.8 M20.8 9.2 A8.6 8.6 0 0 1 20.8 22.8" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.6 13.4 C18.4 12.2 17.4 11.6 16 11.6 C14.4 11.6 13.4 12.4 13.4 13.5 C13.4 16.2 18.8 15 18.8 18 C18.8 19.3 17.6 20.3 16 20.3 C14.4 20.3 13.3 19.6 13.1 18.3 M16 10.2 V11.6 M16 20.3 V21.8" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  usdt: (
    <>
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path d="M9.5 9 H22.5 V12 H17.5 V23.5 H14.5 V12 H9.5 Z" fill="#FFFFFF" />
      <ellipse cx="16" cy="15.4" rx="7.6" ry="2.3" fill="none" stroke="#FFFFFF" strokeWidth="1.4" />
    </>
  ),
  btc: (
    <>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <g transform="rotate(14 16 16)">
        <path d="M12.6 9.6 H17.2 C19.2 9.6 20.3 10.6 20.3 12.1 C20.3 13.4 19.5 14.2 18.4 14.5 C19.8 14.8 20.8 15.8 20.8 17.3 C20.8 19.2 19.4 20.4 17.1 20.4 H12.6 Z M14.9 11.5 V14 H16.9 C17.7 14 18.2 13.5 18.2 12.8 C18.2 12 17.7 11.5 16.9 11.5 Z M14.9 15.7 V18.5 H17.1 C18 18.5 18.6 18 18.6 17.1 C18.6 16.2 18 15.7 17.1 15.7 Z M14.4 8 V9.6 M16.6 8 V9.6 M14.4 20.4 V22 M16.6 20.4 V22" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.4" fillRule="evenodd" />
      </g>
    </>
  ),
  eth: (
    <>
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16 5 V13.1 L22.9 16.2 Z" fill="#FFFFFF" fillOpacity=".6" />
      <path d="M16 5 L9.1 16.2 L16 13.1 Z" fill="#FFFFFF" />
      <path d="M16 21.5 V27 L22.9 17.4 Z" fill="#FFFFFF" fillOpacity=".6" />
      <path d="M16 27 V21.5 L9.1 17.4 Z" fill="#FFFFFF" />
      <path d="M16 20.2 L22.9 16.2 L16 13.1 Z" fill="#FFFFFF" fillOpacity=".2" />
      <path d="M9.1 16.2 L16 20.2 V13.1 Z" fill="#FFFFFF" fillOpacity=".6" />
    </>
  ),
  sol: (
    <>
      <defs>
        <linearGradient id="solg" x1="8" y1="22" x2="24" y2="10" gradientUnits="userSpaceOnUse"><stop stopColor="#9945FF" /><stop offset="1" stopColor="#14F195" /></linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#0D1222" />
      <path d="M11.2 10.4 H23.6 L20.8 13 H8.4 Z M8.4 14.7 H20.8 L23.6 17.3 H11.2 Z M11.2 19 H23.6 L20.8 21.6 H8.4 Z" fill="url(#solg)" />
    </>
  ),
};

const BADGES: Record<string, React.ReactNode> = {
  base: (<><circle cx="8" cy="8" r="8" fill="#0052FF" /><circle cx="8" cy="8" r="4.6" fill="#FFFFFF" /><rect x="2.8" y="7.3" width="5.4" height="1.4" fill="#0052FF" /></>),
  tron: (<><circle cx="8" cy="8" r="8" fill="#EB0029" /><path d="M4.4 4.6 L12 6.2 L8 12 Z M4.4 4.6 L8 12 M12 6.2 L7.2 8.2" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" /></>),
  bnb: (<><circle cx="8" cy="8" r="8" fill="#F0B90B" /><path d="M8 3.8 L10 5.8 L8 7.8 L6 5.8 Z M8 8.2 L10 10.2 L8 12.2 L6 10.2 Z M3.8 8 L5.6 6.2 L7.4 8 L5.6 9.8 Z M12.2 8 L10.4 9.8 L8.6 8 L10.4 6.2 Z" fill="#FFFFFF" /></>),
  sol: (<><circle cx="8" cy="8" r="8" fill="#0D1222" /><path d="M5.6 4.9 H11.8 L10.4 6.2 H4.2 Z M4.2 7.35 H10.4 L11.8 8.65 H5.6 Z M5.6 9.8 H11.8 L10.4 11.1 H4.2 Z" fill="#14F195" /></>),
};

export default function CoinLogo({ coin, size = 36 }: { coin: { logo: string; badge?: string }; size?: number }) {
  const b = Math.round(size * 0.44);
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 32 32">{LOGOS[coin.logo]}</svg>
      {coin.badge && (
        <svg width={b} height={b} viewBox="-1 -1 18 18" style={{ position: "absolute", right: -3, bottom: -3 }}>
          <circle cx="8" cy="8" r="9" fill="#FFFFFF" />
          {BADGES[coin.badge]}
        </svg>
      )}
    </span>
  );
}
