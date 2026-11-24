// Sample every film. Fail overlap, tiny type, crowded frames, or more than six words.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.cwd(), "films/node_modules/playwright/package.json"));
const { chromium } = require("playwright");

const root = process.cwd();
const built = spawnSync("node", ["packages/engine/src/cli.js", "sample", "--html-only"], { cwd: root, stdio: "inherit" });
if (built.status !== 0) process.exit(built.status ?? 1);

const names = ["keel", "northwind"];
const browser = await chromium.launch();
const problems = [];
const ratios = [];
for (const name of names) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(path.join(root, "films/samples", name, "film.html")).href);
  await page.waitForFunction("window.READY === true");
  const dur = await page.evaluate("window.DUR");
  for (let t = 0.7; t < dur - 0.25; t += 0.5) {
    const hits = await page.evaluate((time) => {
      window.render(time);
      const scene = [...document.querySelectorAll(".scene")].find((el) => getComputedStyle(el).visibility === "visible");
      if (!scene) return ["no scene"];
      const out = [];
      const shown = (el) => {
        let p = el;
        while (p) {
          const s = getComputedStyle(p);
          if (s.display === "none" || s.visibility === "hidden") return false;
          if (parseFloat(s.opacity) < 0.45) return false;
          p = p.parentElement;
        }
        return true;
      };
      const boxes = [...scene.querySelectorAll("[data-box]")].filter((el) => shown(el) || !el.hasAttribute("data-at"));
      const rect = (el) => el.getBoundingClientRect();
      const hit = (a, b) => {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return w > 4 && h > 4;
      };
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (a.dataset.stack && a.dataset.stack === b.dataset.stack) continue;
          if (a.dataset.inside === b.dataset.id || b.dataset.inside === a.dataset.id) continue;
          if (hit(rect(a), rect(b))) out.push(`${time.toFixed(1)}s overlap ${a.dataset.id} ${b.dataset.id}`);
        }
      }
      let words = 0;
      const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const el = node.parentElement;
        if (!el || !shown(el) || el.closest("[data-fx]")) continue;
        const bits = node.textContent.trim().split(/\s+/).filter(Boolean);
        if (!bits.length) continue;
        words += bits.length;
        const size = parseFloat(getComputedStyle(el).fontSize);
        const weight = parseFloat(getComputedStyle(el).fontWeight);
        const role = el.closest("[data-role]")?.dataset.role || "";
        if (role === "headline" && (size < 1080 * 0.08 || size > 1080 * 0.12 || weight < 700)) out.push(`${time.toFixed(1)}s headline ${size}px/${weight}`);
        else if (role === "sub" && (size < 1080 * 0.02 || size > 1080 * 0.032 || weight > 500)) out.push(`${time.toFixed(1)}s sub ${size}px/${weight}`);
        else if (role !== "headline" && role !== "sub" && size < 28) out.push(`${time.toFixed(1)}s tiny ${size}px ${bits.join(" ").slice(0, 24)}`);
        const r = rect(el);
        const home = el.closest("[data-box]");
        for (const box of boxes) {
          if (box.contains(el) || el.contains(box)) continue;
          if (home && home.dataset.stack && home.dataset.stack === box.dataset.stack) continue;
          if (hit(r, rect(box))) out.push(`${time.toFixed(1)}s text hits ${box.dataset.id}`);
        }
      }
      if (words > 6) out.push(`${time.toFixed(1)}s ${words} words`);
      let area = 0;
      for (const el of scene.querySelectorAll("[data-area]")) area += el.offsetWidth * el.offsetHeight;
      const empty = 1 - area / (1920 * 1080);
      if (empty < 0.8) out.push(`${time.toFixed(1)}s crowded empty ${(empty * 100).toFixed(0)}%`);
      if (empty > 0.99) out.push(`${time.toFixed(1)}s blank`);
      const play = scene.dataset.play;
      if (play && (empty < 0.8 || empty > 0.92)) out.push(`${time.toFixed(1)}s ${play} empty ${(empty * 100).toFixed(0)}%`);
      out.push(`ratio ${empty.toFixed(3)}`);
      return out;
    }, +t.toFixed(2));
    const ratio = hits.find((h) => h.startsWith("ratio "));
    if (ratio) ratios.push(`${name} ${t.toFixed(1)} ${ratio}`);
    for (const hit of hits) if (!hit.startsWith("ratio ")) problems.push(`${name} ${hit}`);
  }
  await page.close();
}
await browser.close();
if (problems.length) {
  console.error(problems.slice(0, 40).join("\n"));
  console.error(`${problems.length} frame problems`);
  process.exit(1);
}
console.log("frames ok");
console.log(ratios.filter((_, i) => i % 4 === 0).join("\n"));
