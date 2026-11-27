import assert from "node:assert/strict";
import test from "node:test";
import { readBrief } from "../src/brief.js";
import { compileDirection, directFilm, estimateDirectorCost, filmPrompt, resetDirectorState } from "../src/direct.js";
import { DIRECTOR_BRIEFS, RECORDED } from "../src/exemplars.js";
import { directionFromBeats, grammarDirection, LAYOUTS, normalizeDirection } from "../src/dsl.js";
import { cutShots } from "../src/stage.js";
import { compose, composeWithModel } from "../src/index.js";
import { configuredProviders } from "../src/providers.js";

const SFX = new Set(["tick", "click", "whoosh", "chime", "thud", "ui"]);

function brief(id = "keel") {
  const read = readBrief(DIRECTOR_BRIEFS[id]);
  assert.equal(read.ok, true, read.reason);
  return read.brief;
}

function reply(payload, usage = { prompt_tokens: 140, completion_tokens: 90 }) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }], usage }),
  };
}

function provider(id = "mock") {
  return [{ id, tier: "free", key: "test-key", base: `http://${id}.invalid`, model: "mock", priceIn: 0, priceOut: 0 }];
}

test("recorded directions compile into different 2D films", () => {
  const films = {};
  for (const id of Object.keys(RECORDED)) {
    const made = compileDirection(brief(id), RECORDED[id], { seed: id });
    assert.equal(made.ok, true, `${id}: ${made.reason}`);
    assert.equal(made.duration, brief(id).length);
    assert.equal(made.layouts.at(-1), "end");
    assert.equal(new Set(made.layouts).size, made.layouts.length, made.layouts.join(","));
    assert.match(made.html, /data-director="1"/);
    assert.match(made.html, /data-layout="/);
    assert.doesNotMatch(made.html, /perspective|rotateX|rotateY|matrix3d/i);
    assert.doesNotMatch(made.html, /soundtrack|music bed|<audio/i);
    assert.ok(made.events.length >= 4);
    assert.ok(made.events.every((event) => SFX.has(event.sfx) && event.t >= 0 && event.t < made.duration));
    films[id] = made;
  }
  const sequences = new Set(Object.values(films).map((film) => film.layouts.join(",")));
  assert.equal(sequences.size, 5);
  assert.match(films.keel.html, /data-layout="code"/);
  assert.match(films.keel.html, /data-count="98"/);
  assert.match(films.keel.html, /data-kind="dashboard"/);
  assert.match(films.north.html, /data-layout="wipe"/);
  assert.match(films.lumen.html, /data-kind="sentence"/);
  assert.match(films.linear.html, /data-layout="search"/);
  assert.match(films.harbor.html, /data-kind="chat"/);
  assert.match(films.keel.html, /data-face="mono"/);
  assert.match(films.keel.html, /class="panel /);
  assert.match(films.keel.html, /data-link="/);
  assert.match(films.lumen.html, /data-face="display"/);
  assert.match(films.lumen.html, /data-shape="pill"/);
  assert.match(films.linear.html, /data-face="sans"/);
  assert.match(films.linear.html, /data-camera="parallax"/);
  for (const id of ["keel", "lumen", "linear"]) {
    const parts = [...films[id].html.matchAll(/data-layout="([^"]+)" data-phase="\d+" data-start="([\d.]+)" data-end="([\d.]+)"/g)];
    const ends = parts.filter((part) => part[1] === "end");
    assert.equal(ends.length, 1, id);
    const endDur = Number(ends[0][3]) - Number(ends[0][2]);
    assert.ok(endDur >= 1.8 && endDur <= 2.2, `${id} end ${endDur}`);
  }
  assert.doesNotMatch(films.lumen.html, /class="tile word"/);
  const rules = compose(DIRECTOR_BRIEFS.keel);
  assert.notEqual(rules.html, films.keel.html);
});

test("every layout places without an overlap", () => {
  const src = brief();
  for (const layout of LAYOUTS) {
    const copy = layout === "metric" ? "Up to 98%" : "Types the change";
    const made = compileDirection(src, {
      treatment: "paper",
      rhythm: "tight",
      concept: layout,
      shots: [
        { role: "hook", layout, copy, highlight: "", rows: ["Types the change", "Finds the bug", "Shows the diff"] },
        { role: "intro", layout: "lockup", copy: "Keel" },
        { role: "feature", layout: "dashboard", copy: "Finds the bug", rows: ["Finds the bug", "Shows the diff"] },
        { role: "close", layout: "end", copy: "keel.example" },
      ],
    }, { seed: layout });
    assert.equal(made.ok, true, `${layout}: ${made.reason}`);
  }
});

test("cuts stay whole under two seconds and the end card is one hold", () => {
  const held = cutShots([
    { layout: "wipe", start: 0, end: 1.6, dur: 1.6, enter: "whip" },
    { layout: "end", start: 1.6, end: 4.2, dur: 2.6, enter: "cut" },
  ]);
  assert.equal(held.length, 2);
  assert.equal(held[1].layout, "end");
  assert.equal(held[1].dur, 2.6);
  const split = cutShots([{ layout: "code", start: 0, end: 3, dur: 3, enter: "mask" }]);
  assert.equal(split.length, 2);
  assert.equal(split[0].phase, 0);
  assert.equal(split[1].phase, 1);
  assert.equal(split[1].enter, "cut");
});

test("a scene shows its own line, and a chat plan is followed in order", async () => {
  const src = brief();
  const one = compileDirection(src, {
    shots: [
      { copy: "Types the change", layout: "wipe", rows: [] },
      { copy: "Finds the bug", layout: "scatter", rows: [] },
      { copy: "keel.example", layout: "end" },
    ],
  }, { seed: "lines", approved: true });
  assert.equal(one.ok, true, one.reason);
  const wipe = one.html.split('data-layout="wipe"')[1].split('data-layout="scatter"')[0];
  assert.match(wipe, />T<\/span><span class="ch"[^>]*>y<\/span>/);
  assert.doesNotMatch(wipe, /Finds the bug|Shows the diff|Reviews stall/);
  assert.doesNotMatch(one.html.split('data-layout="end"')[1].split("</section>")[0], /data-ribbon/);
  assert.match(wipe, /font-size:156px/);
  assert.doesNotMatch(wipe, /font-size:2\d\dpx/);
  const plan = { title: "Keel", beats: ["Keel", "Reviews stall", "Types the change", "Finds the bug"], length: 30, colours: "#0E7C66" };
  const alpha = await composeWithModel(DIRECTOR_BRIEFS.keel, { plan, model: false, seed: "a" });
  const beta = await composeWithModel(DIRECTOR_BRIEFS.keel, { plan, model: false, seed: "b" });
  assert.equal(alpha.ok, true, alpha.reason);
  assert.equal(alpha.planNote, "plan");
  assert.deepEqual(alpha.layouts, beta.layouts);
  assert.deepEqual(alpha.layouts, ["logo", "wipe", "scatter", "code", "end"]);
  assert.doesNotMatch(alpha.html, /Shows the diff/);
  const built = directionFromBeats(src, plan.beats);
  assert.equal(built.shots.length, 5);
});

test("a new seed changes the picture and an approved plan is followed", async () => {
  const src = brief();
  const alpha = compileDirection(src, RECORDED.keel, { seed: "alpha" });
  const beta = compileDirection(src, RECORDED.keel, { seed: "beta" });
  assert.equal(alpha.ok, true);
  assert.equal(beta.ok, true);
  assert.notEqual(alpha.html, beta.html);
  assert.match(alpha.html, /data-bg="/);
  const followed = await composeWithModel(DIRECTOR_BRIEFS.keel, { plan: RECORDED.keel, seed: "plan-test", model: false });
  assert.equal(followed.ok, true);
  assert.equal(followed.planNote, "plan");
  assert.match(followed.html, /data-layout="code"/);
  assert.match(followed.html, /data-ribbon/);
});

test("a direction cannot invent a claim or carry markup", () => {
  const src = brief();
  const invented = normalizeDirection({
    shots: [
      { copy: "Keel" },
      { copy: "10000 customers switched" },
      { copy: "Types the change" },
      { copy: "keel.example" },
    ],
  }, src);
  assert.equal(invented.ok, false);
  const markup = normalizeDirection({
    shots: [
      { copy: "Keel" },
      { copy: "<script>alert(1)</script>" },
      { copy: "Types the change" },
      { copy: "keel.example" },
    ],
  }, src);
  assert.equal(markup.ok, false);
});

test("the same direction is stable, and a seed changes the grammar", () => {
  const src = brief();
  const a = compileDirection(src, RECORDED.keel, { seed: "1" });
  const b = compileDirection(src, RECORDED.keel, { seed: "1" });
  assert.equal(a.html, b.html);
  const seen = new Set();
  for (let i = 0; i < 12; i++) {
    const made = grammarDirection(src, String(i));
    assert.equal(made.ok, true, made.reason);
    seen.add(made.direction.shots.map((shot) => shot.layout).join(","));
  }
  assert.ok(seen.size >= 2, [...seen].join(" | "));
});

test("a real logo is placed and a script is not", () => {
  const logo = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>');
  const made = compileDirection({ ...brief(), logo }, RECORDED.keel, { seed: "logo" });
  assert.equal(made.ok, true, made.reason);
  assert.match(made.html, /class="logo"/);
  assert.doesNotMatch(made.html, /<script>alert/);
});

test("free providers are preferred and paid keys are not a silent fallback", () => {
  assert.equal(configuredProviders({}).length, 0);
  assert.deepEqual(configuredProviders({ GEMINI_API_KEY: "g", OPENAI_API_KEY: "o" }).map((item) => item.id), ["gemini"]);
  assert.deepEqual(
    configuredProviders({ GEMINI_API_KEY: "g", OPENAI_API_KEY: "o", HARKAT_DIRECTOR_ALLOW_PAID: "1" }).map((item) => item.id),
    ["gemini", "openai"],
  );
  assert.equal(configuredProviders({ MISTRAL_API_KEY: "m" })[0].id, "mistral");
  assert.equal(configuredProviders({ CLOUDFLARE_API_TOKEN: "t" }).length, 0);
  assert.equal(configuredProviders({ CLOUDFLARE_API_TOKEN: "t", CLOUDFLARE_ACCOUNT_ID: "acct" })[0].id, "cloudflare");
  assert.equal(configuredProviders({ GROQ_API_KEY: "g" })[0].model, "openai/gpt-oss-120b");
  assert.equal(configuredProviders({ GEMINI_API_KEY: "g" })[0].model, "gemini-3.5-flash-lite");
  const free = estimateDirectorCost({ GEMINI_API_KEY: "g" });
  assert.equal(free.usd, 0);
  const paid = estimateDirectorCost({ OPENAI_API_KEY: "o" });
  assert.ok(paid.usd > 0 && paid.usd < 0.01, String(paid.usd));
});

test("the director prompt carries the brief and the hard rules", async () => {
  resetDirectorState();
  const src = brief();
  const prompt = filmPrompt(src, { seed: "7", siteText: "Reviews that ship" });
  assert.match(prompt, /Keel/);
  assert.match(prompt, /Seed: 7/);
  assert.match(prompt, /Reviews that ship/);
  assert.doesNotMatch(prompt, /test-key|api_key/i);
  let system = "";
  const made = await directFilm(src, {
    seed: "prompt",
    ip: "prompt-test",
    steps: 1,
    timeout: 8000,
    providers: provider(),
    cache: false,
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      system = body.messages[0].content;
      assert.equal(init.headers.Authorization, "Bearer test-key");
      assert.equal(body.stream, false);
      return reply(RECORDED.keel);
    },
  });
  assert.equal(made.ok, true, made.reason);
  assert.match(system, /no music/);
  assert.match(system, /no photographs/);
  assert.match(system, /no 3D/);
  assert.equal(made.note, "mock");
  assert.equal(made.film.planSource, undefined);
  assert.match(made.film.html, /data-layout="code"/);
});

test("a bad JSON reply is repaired once", async () => {
  resetDirectorState();
  let calls = 0;
  const made = await directFilm(brief(), {
    seed: "repair",
    ip: "repair-test",
    steps: 1,
    timeout: 8000,
    cache: false,
    providers: provider(),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) return reply({ concept: "not a film" });
      return reply(RECORDED.keel);
    },
  });
  assert.equal(made.ok, true, made.reason);
  assert.equal(calls, 2);
  assert.match(made.film.html, /data-director/);
});

test("the next provider is used when the first returns 429", async () => {
  resetDirectorState();
  const seen = [];
  const made = await directFilm(brief(), {
    seed: "fallback",
    ip: "fallback-test",
    steps: 1,
    timeout: 8000,
    cache: false,
    providers: [...provider("down"), ...provider("up")],
    fetchImpl: async (url) => {
      seen.push(url);
      if (String(url).includes("down")) return { ok: false, status: 429, json: async () => ({}) };
      return reply(RECORDED.keel);
    },
  });
  assert.equal(made.ok, true, made.reason);
  assert.equal(made.note, "up");
  assert.ok(seen.some((url) => String(url).includes("down")));
});

test("json mode is retried without response_format after a 400", async () => {
  resetDirectorState();
  const formats = [];
  const made = await directFilm(brief(), {
    seed: "bare",
    ip: "bare-test",
    steps: 1,
    timeout: 8000,
    cache: false,
    providers: provider(),
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      formats.push(Boolean(body.response_format));
      if (body.response_format) return { ok: false, status: 400, json: async () => ({}) };
      return reply(RECORDED.keel);
    },
  });
  assert.equal(made.ok, true, made.reason);
  assert.deepEqual(formats, [true, false]);
});

test("a repeated brief is cached and a second seed stops at the daily cap", async () => {
  const savedIp = process.env.HARKAT_DIRECTOR_IP_DAY;
  const savedAll = process.env.HARKAT_DIRECTOR_GLOBAL_DAY;
  process.env.HARKAT_DIRECTOR_IP_DAY = "1";
  process.env.HARKAT_DIRECTOR_GLOBAL_DAY = "10";
  resetDirectorState();
  let calls = 0;
  const opts = {
    ip: "cap-test",
    steps: 1,
    timeout: 8000,
    providers: provider(),
    fetchImpl: async () => {
      calls += 1;
      return reply(RECORDED.keel);
    },
  };
  try {
    const first = await directFilm(brief(), { ...opts, seed: "same" });
    const again = await directFilm(brief(), { ...opts, seed: "same" });
    const blocked = await composeWithModel(DIRECTOR_BRIEFS.keel, { ...opts, seed: "other" });
    assert.equal(first.ok, true, first.reason);
    assert.equal(again.note, "cache");
    assert.equal(again.cost, 0);
    assert.equal(calls, 1);
    assert.equal(blocked.ok, true);
    assert.equal(blocked.planSource, "rules");
    assert.equal(blocked.planNote, "quota");
    assert.equal(calls, 1);
  } finally {
    if (savedIp === undefined) delete process.env.HARKAT_DIRECTOR_IP_DAY;
    else process.env.HARKAT_DIRECTOR_IP_DAY = savedIp;
    if (savedAll === undefined) delete process.env.HARKAT_DIRECTOR_GLOBAL_DAY;
    else process.env.HARKAT_DIRECTOR_GLOBAL_DAY = savedAll;
    resetDirectorState();
  }
});

test("three director steps keep the brief's words when the model answers", async () => {
  resetDirectorState();
  const tasks = [];
  const made = await directFilm(brief(), {
    seed: "steps",
    ip: "steps-test",
    steps: 3,
    timeout: 20000,
    cache: false,
    critique: false,
    providers: provider(),
    fetchImpl: async (_url, init) => {
      const user = JSON.parse(init.body).messages.at(-1).content;
      const task = user.startsWith("Task: concept") ? "concept" : user.startsWith("Task: beats") ? "beats" : "shots";
      tasks.push(task);
      if (task === "concept") {
        return reply({
          concept: "Meters, then the change.",
          treatment: "ink-open",
          rhythm: "tight",
          layouts: ["meter", "kinetic", "split", "counter", "end"],
        });
      }
      if (task === "beats") {
        return reply({
          beats: [
            { role: "hook", copy: "Reviews stall", highlight: "stall" },
            { role: "intro", copy: "Keel" },
            { role: "feature", copy: "Types the change", highlight: "change", rows: ["Finds the bug", "Shows the diff"] },
            { role: "proof", copy: "Up to 98%", highlight: "98%" },
            { role: "close", copy: "keel.example" },
          ],
        });
      }
      return reply({
        shots: [
          { layout: "meter", motion: "stagger", camera: "hold", enter: "cut", ground: "ink", sfx: "tick" },
          { layout: "logo", motion: "scale", camera: "push", enter: "whip", ground: "paper", sfx: "whoosh" },
          { layout: "split", motion: "letters", camera: "pan", enter: "mask", ground: "paper", sfx: "click" },
          { layout: "counter", motion: "count", camera: "hold", enter: "push", ground: "paper", sfx: "ui" },
          { layout: "end", motion: "rise", camera: "hold", enter: "scale", ground: "accent", sfx: "chime" },
        ],
      });
    },
  });
  assert.equal(made.ok, true, made.reason);
  assert.deepEqual(tasks, ["concept", "beats", "shots"]);
  assert.match(made.film.html, /data-layout="metric"/);
  assert.match(made.film.html, /data-count="98"/);
  assert.match(made.film.html, /Keel/);
  assert.doesNotMatch(made.film.html, /customers|award/i);
});
