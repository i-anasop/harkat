export { screenText } from "./halal.js";
export { readBrief } from "./brief.js";
export { rulePlan, validatePlan } from "./plan.js";
export { assertClear, contentRatio } from "./layout.js";
export { extractSite, vetUrl, isBlockedIp, fetchPublicPage, fetchImageData, sanitizeSvg } from "./site.js";
export { estimatePlannerCost, planWithModel } from "./llm.js";
export { SAMPLE_BRIEF, SAMPLES } from "./sample.js";
export { beats } from "./motion.js";
export { buildShots } from "./scenes.js";

import { readBrief } from "./brief.js";
import { buildFilm } from "./film.js";
import { planWithModel } from "./llm.js";
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

/** Same as compose. A model may plan scenes when an API key is set. It never writes animation. */
export async function composeWithModel(input, opts = {}) {
  const read = readBrief(input);
  if (!read.ok) return read;
  const planned = await planWithModel(read.brief, opts);
  const made = finish(read.brief, { ...opts, plan: planned.plan });
  if (!made.ok && planned.source === "model") {
    const again = finish(read.brief, { ...opts, plan: rulePlan(read.brief) });
    if (!again.ok) return again;
    return { ...again, planSource: "rules", planCost: 0, planTokens: { in: 0, out: 0 } };
  }
  if (!made.ok) return made;
  return { ...made, planSource: planned.source, planCost: planned.cost, planTokens: planned.tokens };
}
