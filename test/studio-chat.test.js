import assert from "node:assert/strict";
import test from "node:test";
import { isSmallTalk, parseModelReply, replyWithoutModel } from "../apps/web/lib/studioChat.mjs";

test("a greeting never becomes a film", () => {
  const reply = replyWithoutModel([{ role: "user", text: "hey whats up mate" }]);
  assert.equal(reply.kind, "talk");
  assert.equal(reply.plan, undefined);
  assert.match(reply.text, /product|film/i);
  assert.ok(reply.text.length < 160);
  assert.equal(isSmallTalk("hey whats up mate"), true);
});

test("a product line becomes a short plan, not a render", () => {
  const reply = replyWithoutModel([{ role: "user", text: "Keel finds the bug before the launch ships" }], { length: 15 });
  assert.equal(reply.kind, "plan");
  assert.ok(reply.plan.beats.length >= 2);
  assert.ok(reply.plan.beats.length <= 6);
  assert.equal(reply.plan.length, 15);
  assert.match(reply.plan.title, /Keel/);
  for (const beat of reply.plan.beats) {
    assert.equal(reply.plan.beats.some((other) => other !== beat && beat.toLowerCase().includes(other.toLowerCase()) && beat.length > other.length + 6), false);
  }
});

test("a follow-up can change the length without a new product", () => {
  const first = replyWithoutModel([{ role: "user", text: "Keel finds the bug before the launch ships" }]);
  const next = replyWithoutModel([
    { role: "user", text: "Keel finds the bug before the launch ships" },
    { role: "assistant", text: first.text, plan: first.plan },
    { role: "user", text: "make it 30 seconds" },
  ]);
  assert.equal(next.kind, "plan");
  assert.equal(next.plan.length, 30);
  assert.equal(next.plan.title, first.plan.title);
});

test("gambling is declined before a plan", () => {
  const reply = replyWithoutModel([{ role: "user", text: "A casino app that takes bets on the big game tonight" }]);
  assert.equal(reply.kind, "decline");
  assert.match(reply.text, /gambling|betting/i);
});

test("a model reply keeps the readable line and the plan", () => {
  const parsed = parseModelReply("Here's a short cut.\n---\n{\"kind\":\"plan\",\"title\":\"Keel\",\"beats\":[\"Finds the bug\",\"Ships the launch\",\"Shows the diff\",\"Names Keel\"],\"length\":15,\"colours\":\"#112233\"}");
  assert.equal(parsed.kind, "plan");
  assert.equal(parsed.text, "Here's a short cut.");
  assert.equal(parsed.plan.beats.length, 4);
  assert.equal(parsed.plan.colours, "#112233");
});
