export function hexToRgb(hex) {
  const n = hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

export function rgbToHex(channels) {
  return (
    "#" +
    channels
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function mixHex(a, b, p) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * p));
}

export function luminance(hex) {
  const lin = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** One accent in, a light-theme palette out. Neutrals stay Harkat-neutral; the hue is the client's. */
export function palette(accent) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(accent || "") ? accent : "#2E4BDB";
  const deepMix = luminance(safe) > 0.62 ? 0.86 : 0.7;
  return {
    accent: safe,
    accentDeep: mixHex(safe, "#061018", deepMix),
    accentSoft: mixHex(safe, "#FFFFFF", 0.88),
    ink: "#0D1222",
    muted: "#5B6275",
    grey: "#B4B9C6",
    bg: "#F6F7F9",
    line: "#E6E8EE",
    onAccent: luminance(safe) > 0.62 ? "#0D1222" : "#FFFFFF",
  };
}
