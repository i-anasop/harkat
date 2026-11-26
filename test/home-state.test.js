import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { clientDayAnchor, readHistory, resetDayAnchor } from "../apps/web/lib/homeState.mjs";

test("the day anchor stays put so a render cannot loop", () => {
  resetDayAnchor();
  const first = clientDayAnchor(1_700_000_000_000);
  const second = clientDayAnchor(1_800_000_000_000);
  const third = clientDayAnchor(Date.now());
  assert.equal(first, second);
  assert.equal(second, third);
  assert.ok(first > 0);
});

test("a clock that changes every read is the crash this guards", () => {
  let n = 0;
  const bad = () => ++n;
  assert.notEqual(bad(), bad());
  resetDayAnchor();
  assert.equal(clientDayAnchor(10), clientDayAnchor(20));
});

test("the home page does not snapshot Date.now on every render", () => {
  const src = readFileSync(new URL("../apps/web/components/PromptHome.tsx", import.meta.url), "utf8");
  assert.equal(src.includes("() => Date.now()"), false);
  assert.equal(src.includes("useSyncExternalStore(subscribeNow"), false);
});

test("old and corrupt saved films do not throw", () => {
  assert.deepEqual(readHistory("nope"), []);
  assert.deepEqual(readHistory("null"), []);
  assert.deepEqual(readHistory("{}"), []);
  assert.deepEqual(readHistory("[]"), []);
  const old = JSON.stringify([
    { prompt: "Keel finds the bug" },
    { title: "  ", prompt: "  " },
    null,
    { prompt: "Lumen matches the brand", at: "yesterday", length: 99, events: [{ t: "x" }, { t: 1, sfx: "tick" }] },
  ]);
  const items = readHistory(old);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Keel finds the bug");
  assert.equal(items[0].length, 15);
  assert.equal(items[0].at, 0);
  assert.deepEqual(items[0].events, []);
  assert.deepEqual(items[1].events, [{ t: 1, sfx: "tick" }]);
  assert.equal(items[1].length, 15);
});
