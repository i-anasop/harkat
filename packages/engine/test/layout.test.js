import assert from "node:assert/strict";
import test from "node:test";
import { assertClear, contentRatio, GAP, REVEAL } from "../src/layout.js";
import { compose, SAMPLES } from "../src/index.js";
import { readBrief } from "../src/brief.js";
import { rulePlan } from "../src/plan.js";
import { buildShots } from "../src/scenes.js";

test("overlapping boxes fail the build, stacked cards do not", () => {
  assert.throws(() => assertClear([
    { id: "a", x: 100, y: 100, w: 200, h: 120 },
    { id: "b", x: 180, y: 140, w: 200, h: 120 },
  ]), /overlap/i);
  assert.doesNotThrow(() => assertClear([
    { id: "a", x: 100, y: 100, w: 200, h: 80 },
    { id: "b", x: 100, y: 280, w: 200, h: 80 },
  ]));
  assert.doesNotThrow(() => assertClear([
    { id: "a", x: 400, y: 400, w: 220, h: 140, stack: "deck" },
    { id: "b", x: 460, y: 430, w: 220, h: 140, stack: "deck" },
  ]));
  assert.throws(() => assertClear([
    { id: "card", x: 100, y: 100, w: 300, h: 200 },
    { id: "label", x: 80, y: 80, w: 40, h: 20, inside: "card" },
  ]), /outside/i);
});

test("reveal travel cannot close the gap between boxes", () => {
  assert.ok(GAP > REVEAL + 16);
});

test("sample shots stay sparse and do not overlap", () => {
  for (const sample of SAMPLES) {
    const read = readBrief(sample);
    assert.equal(read.ok, true);
    const shots = buildShots(read.brief, rulePlan(read.brief));
    assert.equal(shots.at(-1).end, sample.length);
    for (const shot of shots) {
      assert.ok(shot.words.length <= 6, `${sample.id} ${shot.kind} ${shot.words.join(" ")}`);
      assert.ok(shot.ratio < 0.2, `${sample.id} ${shot.kind} ${shot.play} filled ${shot.ratio.toFixed(3)}`);
      assert.ok(shot.ratio > 0.012, `${sample.id} ${shot.kind} empty`);
      if (shot.play) {
        assert.ok(shot.ratio >= 0.1 && shot.ratio <= 0.17, `${sample.id} ${shot.play} ratio ${shot.ratio.toFixed(3)}`);
      }
    }
    const film = compose(sample);
    assert.equal(film.ok, true, film.reason);
  }
});

test("content ratio is the area of the placed boxes", () => {
  const ratio = contentRatio([{ area: true, w: 192, h: 108 }, { area: false, w: 500, h: 500 }]);
  assert.ok(Math.abs(ratio - 0.01) < 0.0001);
});
