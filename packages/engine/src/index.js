export { screenText } from "./halal.js";
export { readBrief } from "./brief.js";
export { acceptFill } from "./direct.js";
export { chooseTemplate } from "./templates/index.js";
export { SAMPLE_BRIEF, SAMPLES } from "./sample.js";

import { readBrief } from "./brief.js";
import { buildFilm } from "./templates/index.js";
import { withOptionalModel } from "./llm.js";

function finish(brief, opts) {
  return { ok: true, ...buildFilm(brief, opts) };
}

/** Brief in, film HTML out. No network. The director is rules, not a model. */
export function compose(input, opts = {}) {
  const read = readBrief(input);
  if (!read.ok) return read;
  return finish(read.brief, opts);
}

/** Same as compose, but a model may shorten the words first when an API key is set. */
export async function composeWithModel(input, opts = {}) {
  const read = readBrief(input);
  if (!read.ok) return read;
  return finish(await withOptionalModel(read.brief), opts);
}
