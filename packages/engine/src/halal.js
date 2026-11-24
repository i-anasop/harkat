/**
 * Halal screen. Keyword check, not a lawyer.
 * Declines gambling, betting, prediction markets, adult content, alcohol and drugs.
 * Ordinary product words (slots on a calendar, a public "forum") are left alone.
 */

const RULES = [
  {
    reason: "Harkat doesn’t make films for gambling, betting or prediction markets.",
    patterns: [
      /\bgambl(?:e|ing)\b/i,
      /\bbetting\b/i,
      /\bsports?\s*bet(?:ting)?\b/i,
      /\bsportsbook\b/i,
      /\bbookmaker\b/i,
      /\bcasino\b/i,
      /\bpoker\b/i,
      /\broulette\b/i,
      /\bblackjack\b/i,
      /\blottery\b/i,
      /\bwager(?:s|ing)?\b/i,
      /\bprediction\s+markets?\b/i,
      /\bpolymarket\b/i,
      /\bkalshi\b/i,
    ],
  },
  {
    reason: "Harkat doesn’t make films for adult content.",
    patterns: [
      /\bporn(?:o|ography)?\b/i,
      /\bxxx\b/i,
      /\bnsfw\b/i,
      /\bonlyfans\b/i,
      /\bescort(?:s|ing)?\b/i,
      /\bstrip\s*clubs?\b/i,
      /\badult\s+(?:content|film|video|site)s?\b/i,
    ],
  },
  {
    reason: "Harkat doesn’t make films for alcohol.",
    patterns: [
      /\balcohol\b/i,
      /\bbeer\b/i,
      /\bwines?\b/i,
      /\bwhisk(?:e)?y\b/i,
      /\bvodka\b/i,
      /\btequila\b/i,
      /\bgin\b/i,
      /\brum\b/i,
      /\bbrewery\b/i,
      /\bwinery\b/i,
      /\bdistillery\b/i,
      /\bcocktails?\b/i,
      /\bliquor\b/i,
    ],
  },
  {
    reason: "Harkat doesn’t make films for drugs.",
    patterns: [
      /\bcannabis\b/i,
      /\bmarijuana\b/i,
      /\bweed\b/i,
      /\bcocaine\b/i,
      /\bheroin\b/i,
      /\bnarcotics?\b/i,
      /\brecreational\s+drugs?\b/i,
      /\bdrugs\b/i,
      /\bdrug\s+deal(?:er|ing)?\b/i,
    ],
  },
];

export function screenText(text) {
  const hay = String(text ?? "");
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(hay))) return { ok: false, reason: rule.reason };
  }
  return { ok: true };
}
