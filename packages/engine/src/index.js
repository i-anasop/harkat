export { screenText } from "./halal.js";
export { readBrief } from "./brief.js";
export { rulePlan, validatePlan } from "./plan.js";
export { assertClear, contentRatio } from "./layout.js";
export { extractSite, vetUrl, isBlockedIp, fetchPublicPage, fetchPublicPageRetry, fetchImageData, sanitizeSvg, accentFromPng, accentFromHtml } from "./site.js";
export { estimatePlannerCost, planWithModel } from "./llm.js";
export { briefFromPrompt, typedHost } from "./prompt.js";
export { SAMPLE_BRIEF, SAMPLES } from "./sample.js";
export { beats } from "./motion.js";
export { buildShots } from "./scenes.js";
export { compileDirection, directFilm, estimateDirectorCost, resetDirectorState } from "./direct.js";
export { configuredProviders } from "./providers.js";

import { readBrief } from "./brief.js";
import { compileDirection, directFilm } from "./direct.js";
import { directionFromBeats } from "./dsl.js";
import { buildFilm } from "./film.js";
import { rulePlan } from "./plan.js";

function finish(brief, opts) {
  try {
    return { ok: true, ...buildFilm(brief, opts) };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "This film could not be laid out." };
  }
}

/** Brief in, film HTML out. No network. The director is rules, not a model. */
export function compose(input, opts = {}) {
  const read = readBrief(input);
  if (!read.ok) return read;
  return finish(read.brief, opts);
}

function ruled(brief, opts, note) {
  const made = finish(brief, { ...opts, plan: rulePlan(brief) });
  if (!made.ok) return made;
  return { ...made, planSource: "rules", planCost: 0, planTokens: { in: 0, out: 0 }, planNote: note };
}

/**
 * Same as compose when no model key is set.
 * With a key, a director model chooses the shots. A failed call falls back to the rule plan.
 */
export async function composeWithModel(input, opts = {}) {
  const read = readBrief(input);
  if (!read.ok) return read;
  if (opts.plan && typeof opts.plan === "object") {
    let direction = opts.plan;
    if (!Array.isArray(direction.shots) && Array.isArray(direction.beats)) {
      direction = directionFromBeats(read.brief, direction.beats, opts.siteText || "");
    }
    if (direction && Array.isArray(direction.shots)) {
      const followed = compileDirection(read.brief, direction, { ...opts, approved: true });
      if (followed.ok) {
        return { ok: true, ...followed, planSource: "model", planCost: 0, planTokens: { in: 0, out: 0 }, planNote: "plan" };
      }
    }
  }
  if (opts.model === false || process.env.HARKAT_DIRECTOR === "0") return ruled(read.brief, opts, "off");
  const directed = await directFilm(read.brief, opts);
  if (!directed.ok) return ruled(read.brief, opts, directed.reason || "rules");
  return {
    ok: true,
    ...directed.film,
    planSource: "model",
    planCost: directed.cost,
    planTokens: directed.tokens,
    planNote: directed.note || "model",
  };
}
