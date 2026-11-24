import { base, cue, esc, lastAt, lineHtml, words } from "../copy.js";
import { layoutVariant, slideDir } from "../layout.js";
import { beats } from "../motion.js";
import { endScene, page } from "../shell.js";

/**
 * Distilled from the Pond workflow scenes: a stair of real cards,
 * then a node map you can read, held still once it is complete.
 * Lines are flat. Nothing is tilted.
 */
export function workflowFilm(brief, opts = {}) {
  const plan = base(brief);
  const variant = layoutVariant(brief);
  const dir = slideDir(variant);
  const last = lastAt(plan.hook);
  const stair = Math.max(3.4, +(last + 0.85).toFixed(2));
  const shift = stair - 3.4;
  const map = +(14.6 + shift).toFixed(2);
  const cta = +(map + 8.4).toFixed(2);
  const end = +Math.max(cta + 4.4, 31).toFixed(2);
  const slide = 0.72;

  const hook = plan.hook.map((line) => `<div class="line left" style="font-size:${Math.min(plan.hookSize, 84)}px">${lineHtml(line, "light")}</div>`).join("");
  const crew = [
    ["AM", "Amina M.", "9:14"],
    ["JK", "Jamal K.", "9:41"],
    ["RS", "Rafi S.", "10:06"],
    ["NL", "Noor L.", "10:28"],
  ];
  const tags = ["New", "Draft", "Check", "Logged"];
  const when = beats(stair + 0.4, plan.features.length);
  const stairs = plan.features
    .map((title, i) => {
      const [who, name, clock] = crew[i % crew.length];
      return `<div class="qrow" data-at="${when[i]}" data-pop="${when[i]}">
        <i>${who}</i>
        <span><b>${esc(title)}</b><small>${name} · ${clock}</small></span>
        <span class="meter"><u style="width:${[42, 68, 36, 84][i] || 50}%"></u></span>
        <em>${tags[i] || "Live"}</em>
      </div>`;
    })
    .join("");

  const nodes = [
    { title: "The snag", sub: plan.problem, who: "AM", name: "Amina M.", clock: "9:02", tag: "Open" },
    ...plan.features.map((title, i) => ({
      title,
      sub: ["Mail from Maya Chen", "Matched to last week's voice", "Waiting on a yes", "Written into the log"][i] || "In this run",
      who: ["MC", "JO", "AR", "NL"][i] || "RK",
      name: ["Maya Chen", "Jules Okonkwo", "Ari Rahman", "Noor L."][i] || "Rafi K.",
      clock: ["9:14", "9:28", "9:41", "10:02"][i] || "10:20",
      tag: ["Trigger", "Draft", "Check", "Log"][i] || "Step",
    })),
    { title: "Go live", sub: plan.hostname, who: "GO", name: "Ready", clock: "Thursday", tag: "Live" },
  ].slice(0, 6);
  const grid = [
    [36, 24], [620, 24], [1204, 24],
    [36, 390], [620, 390], [1204, 390],
  ];
  const order = variant === 1 ? [1, 2, 0, 4, 5, 3] : variant === 2 ? [2, 0, 1, 5, 3, 4] : [0, 1, 2, 3, 4, 5];
  const slots = order.map((i) => grid[i]).slice(0, nodes.length);
  const skip = new Set(["your", "the", "a", "an", "in", "of", "for", "to", "and", "with", "on", "it", "from", "that", "this", "one"]);
  const mark = (title) => {
    const parts = words(title).filter((w) => !skip.has(w.toLowerCase()));
    const use = parts.length ? parts : words(title);
    if (use.length >= 2) return (use[0][0] + use[1][0]).toUpperCase();
    return (use[0] || "go").slice(0, 2).toUpperCase();
  };
  const logLines = [
    [["9:02", "Opened"], ["9:14", "Amina M."]],
    [["9:06", "Mail in"], ["9:14", "Maya Chen"]],
    [["9:11", "Drafted"], ["9:28", "Jules Okonkwo"]],
    [["9:20", "Held"], ["9:41", "Ari Rahman"]],
    [["9:33", "Logged"], ["10:02", "Noor L."]],
    [["9:40", "Ready"], ["Thu", "Go live"]],
  ];
  const nodeHtml = nodes
    .map((n, i) => {
      const hot = i === nodes.length - 1 ? " hot" : "";
      const lines = logLines[i] || logLines[0];
      return `<div class="node${hot}" data-at="${(map + 0.22 + i * 0.28).toFixed(2)}" style="left:${slots[i][0]}px;top:${slots[i][1]}px">
        <div class="nh"><i>${esc(mark(n.title))}</i><span><b>${esc(n.title)}</b><small>${esc(n.name)} · ${n.clock}</small></span><em class="before">${n.tag}</em>${hot ? '<em class="after">Live</em>' : ""}</div>
        <p>${esc(n.sub)}</p>
        <ul class="log">${lines.map(([t, who]) => `<li><b>${t}</b> ${esc(who)}</li>`).join("")}<li><b>Now</b> ${n.tag}</li></ul>
        <div class="nmeter"><u style="width:${[28, 46, 62, 54, 74, 100][i] || 50}%"></u></div>
      </div>`;
    })
    .join("");
  const wires = slots
    .slice(0, -1)
    .map((a, i) => {
      const b = slots[i + 1];
      if (Math.abs(a[1] - b[1]) > 20) return "";
      const y = a[1] + 160;
      return `<line x1="${a[0] + 540}" y1="${y}" x2="${b[0]}" y2="${y}" />`;
    })
    .join("");

  const css = `
.hookWord{font-size:84px}
.line.left{justify-content:flex-start}
.nameBlock{position:absolute;left:140px;top:280px;z-index:3;max-width:1200px}
.swap{margin-top:28px;font-size:36px;font-weight:560;letter-spacing:-.04em;color:#fff}
.stepMark{position:absolute;left:90px;top:300px;font-size:220px;font-weight:560;letter-spacing:-.07em;color:rgba(255,255,255,.3);line-height:.8}
.focus{position:absolute;left:680px;top:140px;width:1080px;height:760px;background:#fff;border-radius:36px;box-shadow:0 46px 110px rgba(0,0,0,.42);z-index:2;opacity:1}
.face{position:absolute;inset:64px;display:flex;flex-direction:column;gap:20px;opacity:0}
.face h3{font-size:68px;letter-spacing:-.05em;line-height:1.02;font-weight:560}
.face small{font-size:22px;letter-spacing:.08em;text-transform:uppercase;color:${plan.muted}}
.face p{font-size:30px;line-height:1.35}
.face em{margin-top:16px;align-self:flex-start;font-style:normal;background:${plan.accent};color:#fff;border-radius:16px;padding:18px 28px;font-size:28px;font-weight:560}
.qwin{box-shadow:0 40px 100px rgba(0,0,0,.35)}
.qwin{width:1680px;height:900px;background:#fff;border-radius:28px;box-shadow:0 0 0 1px ${plan.line},0 30px 80px rgba(13,18,34,.1);display:flex;flex-direction:column;overflow:hidden}
.qwin header{height:72px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid ${plan.line}}
.qwin header b,.qwin header small,.qbody aside strong{font-size:22px;color:${plan.ink}}
.qwin header small{font-size:22px;color:${plan.muted}}
.qwin header .dot{width:12px;height:12px;border-radius:99px;background:${plan.accent}}
.qwin header small{color:${plan.muted}}
.qwin header span{margin-left:auto;background:${plan.accentSoft};color:${plan.accent};border-radius:99px;padding:6px 10px;font-size:22px;font-weight:560}
.qbody{flex:1;display:flex;min-height:0}
.qlist{flex:1;padding:20px;display:flex;flex-direction:column;gap:12px;min-height:0}
.qchart{flex:1;display:flex;align-items:flex-end;gap:14px;min-height:140px;padding-top:8px}
.qchart div{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px}
.qchart b{width:100%;background:${plan.accent};border-radius:6px 6px 2px 2px;display:block}
.qchart div:nth-child(odd) b{background:${plan.accentSoft}}
.qchart small{color:${plan.muted};font-size:22px}
.qrow{height:108px;border:1px solid ${plan.line};border-radius:16px;display:flex;align-items:center;gap:14px;padding:0 18px;opacity:0}
.qrow i{width:48px;height:48px;border-radius:99px;background:${plan.accentSoft};color:${plan.accent};display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:560;font-size:22px;flex:none}
.qrow span{display:flex;flex-direction:column;gap:3px;min-width:0}
.qrow b{font-size:28px;font-weight:560;letter-spacing:-.03em}
.qrow small{color:${plan.muted};font-size:22px}
.qrow .meter{width:140px;height:6px;border-radius:99px;background:#E4E7EE;margin-left:auto;flex:none}
.qrow .meter u{display:block;height:100%;background:${plan.accent};border-radius:99px;text-decoration:none}
.qrow em{font-style:normal;background:${plan.accentSoft};color:${plan.accent};border-radius:99px;padding:6px 10px;font-size:22px;font-weight:560}
.qbody aside{width:380px;border-left:1px solid ${plan.line};padding:28px;display:flex;flex-direction:column;gap:12px}
.qbody aside p{font-size:28px;line-height:1.35;letter-spacing:-.03em}
.qstat{display:flex;flex-direction:column;gap:6px;line-height:1}
.qstat b{font-size:56px;letter-spacing:-.05em}
.qstat small{display:block;color:${plan.muted};font-size:22px}
.panel{position:absolute;left:40px;top:96px;width:1840px;height:940px;background:#fff;border-radius:32px;box-shadow:0 0 0 1px ${plan.line},0 30px 80px rgba(13,18,34,.08);display:flex;flex-direction:column;overflow:hidden}
.boardHead{height:72px;display:flex;align-items:center;gap:12px;padding:0 28px;border-bottom:1px solid ${plan.line};flex:none}
.boardHead b{font-size:20px;letter-spacing:-.03em}
.boardHead small{color:${plan.muted}}
.boardHead span{margin-left:auto;background:${plan.accentSoft};color:${plan.accent};border-radius:99px;padding:6px 12px;font-weight:560;font-size:14px;display:flex;align-items:center;gap:6px}
.boardHead span b{font-size:22px;letter-spacing:-.04em}
.boardHead em{font-style:normal}
.board{position:relative;flex:1;background-image:radial-gradient(${plan.line} 1.2px, transparent 1.2px);background-size:22px 22px}
.wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.wires line{stroke:${plan.accent};stroke-width:2;stroke-dasharray:6 8;opacity:.55}
#traveler{position:absolute;width:18px;height:18px;border-radius:99px;background:${plan.accent};box-shadow:0 0 0 6px ${plan.accentSoft};z-index:4}
.node{position:absolute;width:540px;height:340px;background:#fff;border-radius:22px;box-shadow:0 16px 40px rgba(13,18,34,.1);padding:20px 22px;display:flex;flex-direction:column;gap:12px;opacity:0}
.node.focus{left:760px;top:160px;width:1000px;height:720px;border-radius:36px;box-shadow:0 46px 110px rgba(0,0,0,.42);opacity:1;padding:0;z-index:2}
.node.focus .face{opacity:1;inset:40px;gap:16px}
.node.focus h3{font-size:48px}
.node.focus .step{display:flex;align-items:center;gap:16px;min-height:96px;padding:0 18px;border-radius:18px;background:#F3F5F8}
.node.focus .step.on{background:${plan.accentSoft}}
.node.focus .step i{width:52px;height:52px;border-radius:99px;background:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:22px;font-weight:560;flex:none}
.node.focus .step b{font-size:32px;font-weight:560;letter-spacing:-.03em}
.node.focus .meter{height:18px;background:#E4E7EE;border-radius:99px;margin-top:8px}
.node.focus .meter u{display:block;height:100%;width:0;background:${plan.accent};border-radius:99px;text-decoration:none}
.log{list-style:none;display:flex;flex-direction:column;gap:8px}
.log li{display:flex;gap:10px;font-size:15px;color:${plan.muted}}
.log b{width:64px;flex:none;color:${plan.ink};font-weight:560}
.nh{display:flex;align-items:center;gap:12px}
.nh i{width:42px;height:42px;border-radius:12px;background:${plan.accentSoft};color:${plan.accent};display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:560;font-size:13px;flex:none}
.nh span{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.nh b{font-size:22px;font-weight:560;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nh small{color:${plan.muted};font-size:13px}
.nh em{font-style:normal;border-radius:99px;padding:6px 10px;font-size:13px;font-weight:560;flex:none}
.nh em.before{background:${plan.accentSoft};color:${plan.accent}}
.nh em.after{display:none;background:${plan.accent};color:#fff}
.node.show em.before{display:none}
.node.show em.after{display:inline}
.node p{font-size:18px;line-height:1.35;color:${plan.ink}}
.nmeter{margin-top:auto;height:8px;border-radius:99px;background:#E4E7EE}
.nmeter u{display:block;height:100%;border-radius:99px;background:${plan.accent};text-decoration:none}
`;

  const body = `
<section class="scene" style="top:0;background:${plan.accentDeep}" data-variant="${variant}">
  <div class="crop" data-slide="0.15" data-from="${dir.from}" data-to="${dir.to}" data-dur="2.8">${esc(plan.name)}</div>
  <div class="nameBlock"><div class="stack hookWord">${hook}</div>
    <div class="swap" data-at="1.6" data-tone="light">${esc(plan.benefits[0] || plan.name)}</div>
  </div>
</section>
<section class="scene" style="top:1080px;background:linear-gradient(150deg, ${plan.accentDeep}, ${plan.accent})"><div class="mid"><div class="qwin">
  <header><i class="dot"></i><b>${esc(plan.name)}</b><small>Queue · ${esc(plan.hostname)}</small><span>${plan.features.length} open</span></header>
  <div class="qbody">
    <div class="qlist">${stairs}<div class="qchart">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => `<div><b style="height:${[40, 62, 48, 80, 55, 30, 44][i]}%"></b><small>${d}</small></div>`).join("")}</div></div>
    <aside><strong>The snag</strong><p>${esc(plan.problem)}</p><div class="qstat"><b data-count="${plan.features.length}" data-from="${(stair + 0.5).toFixed(2)}">0</b><small>steps in this run</small></div></aside>
  </div>
</div></div></section>
<section class="scene" style="top:2160px;background:${plan.accentDeep}">
  <div class="crop" data-slide="${map}" data-from="${dir.from}" data-to="${dir.to}" data-dur="3">${esc(plan.name)}</div>
  <div class="stepMark" id="stepMark">01</div>
  <article class="node hot focus" id="focus">
    <div class="face" data-face="0">
      <h3>${esc(plan.benefits[0] || plan.name)}</h3>
      <div class="steps">${plan.benefits.map((line, i) => `<div class="step"><i>${i + 1}</i><b>${esc(line)}</b></div>`).join("")}</div>
      <div class="meter"><u id="prog"></u></div>
      <em id="liveBtn">Go live</em>
    </div>
    <div id="cur" class="cursor" style="color:${plan.accent}"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 3 L5 19 L10 15 L14 21 L17 19 L13 13 L19 13 Z" fill="#0D1222"/></svg><i id="ring" class="ring"></i></div>
  </article>
  <div class="wipe" style="background:#fff" data-wipe="${map}"></div>
</section>
${endScene(plan, 3240, cta)}`;

  const state = {
    grey: plan.grey,
    ink: plan.ink,
    slide,
    end,
    stops: [0, stair, map, cta].map((t, i) => ({ t, y: i * 1080 })),
    map,
    stair,
    soft: plan.accentSoft,
    hit: +(map + 3.5).toFixed(2),
    logo: plan.logo,
  };
  const extra = `
function extra(t) {
  const rows = [...document.querySelectorAll(".qrow")];
  const hi = rows.length ? Math.floor((t - STATE.stair) / 1.15) % rows.length : 0;
  rows.forEach((el, i) => {
    el.style.opacity = String(eo(seg(t, +el.dataset.at, +el.dataset.at + 0.35)));
    const on = t >= STATE.stair + 1.2 && t < STATE.map && i === hi;
    el.style.background = on ? STATE.soft : "transparent";
  });
  const faces = [...document.querySelectorAll(".face")];
  const idx = Math.max(0, Math.min(faces.length - 1, Math.floor((t - STATE.map) / 1.15)));
  faces.forEach((el, i) => {
    const on = i === idx;
    el.style.opacity = on ? "1" : "0";
  });
  const mark = document.getElementById("stepMark");
  if (mark) mark.textContent = "0" + (idx + 1);
  const local = seg(t, STATE.map + idx * 1.15, STATE.map + idx * 1.15 + 0.45);
  const focus = document.getElementById("focus");
  if (focus) focus.style.transform = "scale(" + lerp(0.96, 1, q5(Math.min(1, local + 0.2))).toFixed(3) + ")";
  const move = q5(seg(t, STATE.hit - 0.7, STATE.hit - 0.08));
  $("cur").style.opacity = String(idx === 2 ? eo(seg(t, STATE.hit - 0.8, STATE.hit - 0.45)) : 0);
  $("cur").style.left = lerp(420, 160, move) + "px";
  $("cur").style.top = lerp(180, 560, move) + "px";
  const pressing = t >= STATE.hit && t < STATE.hit + 0.18;
  $("cur").style.transform = "scale(" + (pressing ? 0.82 : 1) + ")";
  const click = seg(t, STATE.hit, STATE.hit + 0.36);
  $("ring").style.opacity = String(click > 0 && click < 1 ? 1 - click : 0);
  const btn = document.getElementById("liveBtn");
  if (btn && t > STATE.hit) btn.textContent = "Live now";
  const steps = [...document.querySelectorAll("#focus .step")];
  const k = Math.max(0, (t - STATE.map) / 1.05);
  steps.forEach((el, i) => el.classList.toggle("on", k > i + 0.2));
  const prog = document.getElementById("prog");
  if (prog && steps.length) prog.style.width = Math.min(100, (k / steps.length) * 100).toFixed(1) + "%";
  if (idx === 2 && faces[2]) {
    const since = t - (STATE.map + 2.3);
    faces[2].querySelectorAll("p").forEach((el, i) => {
      el.style.opacity = since > 0.35 + i * 1.05 ? "1" : "0.22";
    });
  }
}`;

  const events = [
    cue(plan.hook[0][0].at, "tick", { gain: -8 }),
    plan.hook[1]?.[0] ? cue(plan.hook[1][0].at, "tick", { gain: -10 }) : null,
    cue(stair, "whoosh", { align: "peak", gain: -2 }),
    cue(stair + 2.4, "tick", { gain: -9 }),
    cue(stair + 4.8, "tick", { gain: -9 }),
    cue(stair + 7.2, "tick", { gain: -9 }),
    cue(stair + 9.6, "tick", { gain: -9 }),
    ...when.map((t) => cue(t, "click", { gain: -7 })),
    cue(map, "whoosh", { align: "peak", gain: -2 }),
    cue(map + 1.15, "tick", { gain: -8 }),
    cue(map + 2.3, "ui", { gain: -8 }),
    cue(map + 3.5, "click", { gain: -5 }),
    cue(cta, "whoosh", { align: "peak", gain: -1 }),
    cue(cta + 0.25, "chime", { gain: -6 }),
    cue(cta + 0.55, "thud", { gain: -4 }),
  ].filter(Boolean);

  return { html: page({ font: opts.fontUrl, css, body, state, extra, accent: plan.accent }), duration: end, events, hostname: plan.hostname, template: "workflow" };
}
