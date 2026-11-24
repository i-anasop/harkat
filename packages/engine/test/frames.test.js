import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

test("sampled frames keep text at 22px and cards at least 45% full", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const run = spawnSync("node", ["films/check-frames.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
});
