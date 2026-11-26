import assert from "node:assert/strict";
import test from "node:test";
import { beats } from "../src/motion.js";
import { compose, composeWithModel, SAMPLE_BRIEF, SAMPLES, screenText } from "../src/index.js";
import { PROVIDER_ENV } from "../src/providers.js";

test("halal screen declines gambling, betting, adult, alcohol and drugs", () => {
  assert.equal(screenText("a sportsbook for friends").ok, false);
  assert.equal(screenText("prediction market for elections").ok, false);
  assert.equal(screenText("onlyfans growth tool").ok, false);
  assert.equal(screenText("craft beer club").ok, false);
  assert.equal(screenText("we sell cannabis online").ok, false);
  assert.equal(screenText("Northstar writes launch posts").ok, true);
  assert.equal(screenText("calendar time slots for a team").ok, true);
});

test("a gambling brief is refused before any film is made", () => {
  const film = compose({ ...SAMPLE_BRIEF, name: "Lucky Casino" });
  assert.equal(film.ok, false);
  assert.match(film.reason, /gambling|betting/i);
});

test("two briefs make different films at their own lengths", () => {
  const keel = compose(SAMPLES[0], { fontUrl: "/fonts/Geist-Variable.woff2" });
  const wind = compose(SAMPLES[1], { fontUrl: "/fonts/Geist-Variable.woff2" });
  assert.equal(keel.ok, true);
  assert.equal(wind.ok, true);
  assert.equal(keel.duration, 30);
  assert.equal(wind.duration, 15);
  assert.equal(keel.goal, "launch");
  assert.equal(wind.goal, "feature");
  assert.match(keel.html, /data-play="type"/);
  assert.match(keel.html, /<section class="scene dark/);
  assert.match(keel.html, /98%/);
  assert.match(wind.html, /data-play="search"/);
  assert.match(wind.html, /data-play="toggle"/);
  assert.match(wind.html, /class="srow"/);
  assert.match(keel.html, /data-count="98"/);
  assert.doesNotMatch(keel.html + wind.html, /class="card deck"/);
  assert.doesNotMatch(wind.html, /<section class="scene dark"/);
  assert.notEqual(keel.html, wind.html);
  assert.match(keel.html, /cubic-bezier|0\.16/);
  assert.doesNotMatch(keel.html + wind.html, /perspective|rotateX|rotateY|matrix3d/i);
  assert.doesNotMatch(keel.html + wind.html, /soundtrack|spotify|music bed/i);
  for (const film of [keel, wind]) {
    assert.ok(film.events.length >= 4);
    assert.ok(film.events.every((e) => e.t >= 0 && e.t < film.duration));
  }
});

test("the same brief always makes the same film", () => {
  const a = compose(SAMPLE_BRIEF);
  const b = compose(SAMPLE_BRIEF);
  assert.equal(a.html, b.html);
  assert.deepEqual(a.events, b.events);
});

test("a name cannot inject markup into the film", () => {
  const film = compose({ ...SAMPLE_BRIEF, name: "<script>alert(1)</script>" });
  assert.equal(film.ok, true);
  assert.doesNotMatch(film.html, /<script>alert/);
  assert.match(film.html, /&lt;script&gt;|script/);
});

test("a logo with a script is refused", () => {
  const logo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>')}`;
  const film = compose({ ...SAMPLE_BRIEF, logo });
  assert.equal(film.ok, false);
});

test("a supplied logo is placed", () => {
  const logo = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>');
  const film = compose({ ...SAMPLE_BRIEF, logo });
  assert.equal(film.ok, true);
  assert.match(film.html, /class="logo"/);
});

test("stagger beats stay inside 100 to 200ms", () => {
  const row = beats(1, 3);
  assert.equal(row[0], 1);
  assert.ok(row[1] - row[0] >= 0.1 && row[1] - row[0] <= 0.2);
  assert.ok(row[2] - row[1] >= 0.1 && row[2] - row[1] <= 0.2);
});

test("without a model key the planner stays on the rules", async () => {
  const saved = PROVIDER_ENV.map((key) => [key, process.env[key]]);
  for (const [key] of saved) delete process.env[key];
  try {
    const made = await composeWithModel(SAMPLE_BRIEF);
    assert.equal(made.ok, true);
    assert.equal(made.planSource, "rules");
    assert.equal(made.planCost, 0);
    assert.equal(made.html, compose(SAMPLE_BRIEF).html);
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
