import assert from "node:assert/strict";
import test from "node:test";
import { readBrief } from "../src/brief.js";
import { estimatePlannerCost } from "../src/llm.js";
import { rulePlan, validatePlan } from "../src/plan.js";
import { SAMPLE_BRIEF, SAMPLES } from "../src/sample.js";

function brief(sample = SAMPLE_BRIEF) {
  const read = readBrief(sample);
  assert.equal(read.ok, true);
  return read.brief;
}

test("the rule plan matches the schema and is deterministic", () => {
  const src = brief();
  const a = rulePlan(src);
  const b = rulePlan(src);
  assert.deepEqual(a, b);
  const checked = validatePlan(a, src);
  assert.equal(checked.ok, true, checked.reason);
  assert.equal(checked.plan.scenes.at(-1).type, "cta");
  assert.ok(checked.plan.scenes.every((scene) => scene.copy.split(" ").length <= 6));
});

test("a plan cannot invent a claim or carry markup", () => {
  const src = brief();
  const invented = validatePlan({
    scenes: [
      { type: "intro", copy: "Keel" },
      { type: "benefit", copy: "10000 teams switched yesterday" },
      { type: "cta", copy: "keel.example" },
    ],
  }, src);
  assert.equal(invented.ok, false);
  const markup = validatePlan({
    scenes: [
      { type: "intro", copy: "Keel" },
      { type: "benefit", copy: "Types the change", html: "<script>" },
      { type: "cta", copy: "keel.example" },
    ],
  }, src);
  assert.equal(markup.ok, false);
  const extraNumber = validatePlan({
    scenes: [
      { type: "intro", copy: "Keel" },
      { type: "proof", copy: "Up to 99%" },
      { type: "cta", copy: "keel.example" },
    ],
  }, src);
  assert.equal(extraNumber.ok, false);
});

test("launch and feature plans choose different beats", () => {
  const launch = rulePlan(brief(SAMPLES[0]));
  const feature = rulePlan(brief(SAMPLES[1]));
  assert.ok(launch.scenes.some((scene) => scene.type === "problem"));
  assert.ok(launch.scenes.some((scene) => scene.type === "proof"));
  assert.equal(feature.scenes.some((scene) => scene.type === "problem"), false);
  assert.equal(feature.scenes.some((scene) => scene.type === "proof"), false);
  const launchV = launch.scenes.map((scene) => scene.vignette).filter(Boolean);
  const featureV = feature.scenes.map((scene) => scene.vignette).filter(Boolean);
  assert.ok(launchV.includes("code"));
  assert.ok(featureV.includes("search"));
  assert.ok(featureV.includes("toggle"));
  assert.notDeepEqual(launchV, featureV);
});

test("planner cost with the cheap model stays under a cent", () => {
  const cost = estimatePlannerCost(brief());
  assert.ok(cost.inputTokens > 50);
  assert.ok(cost.usd > 0);
  assert.ok(cost.usd < 0.01, String(cost.usd));
});
