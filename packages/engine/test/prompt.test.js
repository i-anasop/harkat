import assert from "node:assert/strict";
import test from "node:test";
import { briefFromPrompt, compose, typedHost } from "../src/index.js";

test("a sentence becomes a sample film", () => {
  const parsed = briefFromPrompt("Keel finds the bug before the launch ships");
  assert.equal(parsed.ok, true);
  assert.equal(parsed.inventedHost, true);
  assert.match(parsed.url, /^https:\/\/keel\.example$/);
  const made = compose({ name: parsed.name, problem: parsed.problem, features: parsed.features, url: parsed.url, length: 15, sample: true, goal: "launch" });
  assert.equal(made.ok, true, made.reason);
  assert.match(made.html, /Keel/);
  assert.equal(made.duration, 15);
});

test("a website the person typed is kept", () => {
  const parsed = briefFromPrompt("Linear finds the issue and flips the state", "linear.app");
  assert.equal(parsed.ok, true);
  assert.equal(parsed.inventedHost, false);
  assert.equal(parsed.url, "linear.app");
  assert.equal(parsed.name, "Linear");
  assert.ok(parsed.features.length >= 2);
});

test("a link inside the sentence is the website", () => {
  const parsed = briefFromPrompt("A film for Linear at https://linear.app");
  assert.equal(parsed.ok, true);
  assert.equal(parsed.url, "https://linear.app");
  assert.equal(parsed.inventedHost, false);
});

test("a host typed in the chat is kept and a stand-in is not", () => {
  assert.equal(typedHost("", ["Make a film for linear.app please"]), "linear.app");
  assert.equal(typedHost("https://keel.dev/docs", []), "https://keel.dev/docs");
  assert.equal(typedHost("https://keel.example", ["see linear.app"]), "linear.app");
  assert.equal(typedHost("", ["only keel.example"]), "");
});

test("a short line is refused, and a gambling line still fails the brief", () => {
  const short = briefFromPrompt("Hi");
  assert.equal(short.ok, false);
  const parsed = briefFromPrompt("Casino bets on the big game tonight");
  assert.equal(parsed.ok, true);
  const made = compose({ name: parsed.name, problem: parsed.problem, features: parsed.features, url: parsed.url, length: 15 });
  assert.equal(made.ok, false);
});
