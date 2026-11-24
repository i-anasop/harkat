// Sample every film at 2fps. Flag cards whose ink fills under 45% and text under 22px.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.cwd(), "films/node_modules/playwright/package.json"));
const { chromium } = require("playwright");

const root = process.cwd();
spawnSync("node", ["packages/engine/src/cli.js", "sample", "--html-only"], { cwd: root, stdio: "inherit" });

const names = ["northstar", "lumen", "relay"];
const browser = await chromium.launch();
const problems = [];
for (const name of names) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(path.join(root, "films/samples", name, "film.html")).href);
  await page.waitForFunction("window.READY === true");
  const dur = await page.evaluate("window.DUR");
  for (let t = 0; t < dur; t += 0.5) {
    const hits = await page.evaluate((time) => {
      window.render(time);
      const out = [];
      const shown = (el) => {
        const s = getComputedStyle(el);
        if (parseFloat(s.opacity) < 0.45) return false;
        if (s.visibility === "hidden" || s.display === "none") return false;
        let p = el.parentElement;
        while (p) {
          if (parseFloat(getComputedStyle(p).opacity) < 0.4) return false;
          p = p.parentElement;
        }
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return false;
        if (r.bottom < 0 || r.top > 1080 || r.right < 0 || r.left > 1920) return false;
        return r;
      };
      for (const el of document.querySelectorAll("body *")) {
        if (el.closest(".badge") || el.closest(".crop") || el.classList.contains("stepMark")) continue;
        const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!text) continue;
        const r = shown(el);
        if (!r) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 22) out.push(`${time.toFixed(1)}s ${size}px ${(el.textContent || "").trim().slice(0, 32)}`);
      }
      for (const card of document.querySelectorAll(".focus, .productMini, .hcard, .fcard")) {
        const r = shown(card);
        if (!r || r.height < 120 || r.width < 160) continue;
        const visW = Math.min(r.right, 1920) - Math.max(r.left, 0);
        const visH = Math.min(r.bottom, 1080) - Math.max(r.top, 0);
        if (visW * visH < r.width * r.height * 0.75) continue;
        const bits = [...card.querySelectorAll(".step, h3, .meter, .inbox, .tog, .mbars, em, .mail, .threads, .quiet, .stat, .mock, p")];
        let ink = 0;
        for (const bit of bits) {
          if (bit.closest(".step") && !bit.classList.contains("step")) continue;
          const b = shown(bit);
          if (!b) continue;
          ink += b.width * b.height;
        }
        const ratio = ink / (r.width * r.height);
        if (ratio < 0.45) out.push(`${time.toFixed(1)}s ${card.className} fill ${(ratio * 100).toFixed(0)}%`);
      }
      return out.slice(0, 8);
    }, +t.toFixed(2));
    for (const hit of hits) problems.push(`${name} ${hit}`);
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
