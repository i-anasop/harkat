import { holoFilm } from "./holo.js";
import { launchFilm } from "./launch.js";
import { workflowFilm } from "./workflow.js";

const BUILDERS = { launch: launchFilm, holo: holoFilm, workflow: workflowFilm };

export function chooseTemplate(brief) {
  const asked = String(brief.template || "auto");
  if (BUILDERS[asked]) return asked;
  const text = `${brief.name} ${brief.problem} ${brief.features.join(" ")}`.toLowerCase();
  if (/\b(workflow|automat\w*|pipeline|handoffs?|triggers?)\b/.test(text)) return "workflow";
  if (/\b(agents?|inbox|follow-?ups?|autopilot)\b/.test(text)) return "holo";
  return "launch";
}

export function buildFilm(brief, opts = {}) {
  const template = chooseTemplate(brief);
  return BUILDERS[template](brief, opts);
}

export function filmHtml(brief, opts = {}) {
  return buildFilm(brief, opts).html;
}
