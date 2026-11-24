import { base, cue, esc, lastAt, letterLine, lineHtml } from "../copy.js";
import { clusterSlots, depthFor, layoutVariant, slideDir } from "../layout.js";
import { endScene, miniUi, page } from "../shell.js";

function timing(last, n) {
  const name = Math.max(3.35, +(last + 0.85).toFixed(2));
  const shift = name - 3.35;
  const ui = +(7.7 + shift).toFixed(2);
  const span = n <= 1 ? 6.4 : n === 2 ? 7.2 : n >= 4 ? 9.4 : 8.3;
  const features = +(ui + 9.1).toFixed(2);
  const flow = +(features + span).toFixed(2);
  const cta = +(flow + 4.55).toFixed(2);
  const end = +(cta + 4.05).toFixed(2);
  return { name, ui, features, flow, cta, end, slide: 0.68, span, shift };
}

export function launchFilm(brief, opts = {}) {
  const plan = base(brief);
  const variant = layoutVariant(brief);
  const dir = slideDir(variant);
  const time = timing(lastAt(plan.hook), plan.features.length);
  const hook = plan.hook.map((line) => `<div class="line" style="font-size:${plan.hookSize}px">${lineHtml(line, "light")}</div>`).join("");
  const tasks = [
    { who: "AM", name: "Amina M.", title: "Spring launch", tag: "Draft", time: "9:14", pct: 82 },
    { who: "JK", name: "Jamal K.", title: plan.features[0], tag: "Review", time: "9:41", pct: 64, hot: true },
    { who: "RS", name: "Rafi S.", title: plan.features[1] || "Board", tag: "Queued", time: "10:06", pct: 48 },
    { who: "NL", name: "Noor L.", title: plan.features[2] || "Approve", tag: "Hold", time: "10:22", pct: 30 },
    { who: "OT", name: "Omar T.", title: "Thursday post", tag: "Live", time: "11:02", pct: 100 },
    { who: "SK", name: "Sami K.", title: "Caption pass", tag: "Draft", time: "11:18", pct: 55 },
  ];
  const rowHtml = tasks
    .map(
      (row, i) => `<div class="row${row.hot ? " hot" : ""}" data-at="${(time.ui + 0.4 + i * 0.16).toFixed(2)}">
        <i class="av">${row.who}</i>
        <span><b>${esc(row.title)}</b><small>${esc(row.name)} · ${row.time}</small></span>
        <span class="meter"><u style="width:${row.pct}%"></u></span>
        <em class="before">${row.tag}</em>${row.hot ? '<em class="after">Scheduled</em>' : ""}
      </div>`,
    )
    .join("");
  const nav = ["Home", "Drafts", "Calendar", "Approvals", "Archive"];
  const navHtml = nav.map((item, i) => `<div class="navbtn${i === 1 ? " on" : ""}">${item}</div>`).join("");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heights = [36, 52, 44, 78, 60, 28, 48];
  const bars = days.map((d, i) => `<div class="bar"><b style="height:${heights[i]}%"></b><small>${d}</small></div>`).join("");
  const spark = (pts) => `<svg class="spark" viewBox="0 0 72 28"><polyline points="${pts}" fill="none" stroke="${plan.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const metrics = [
    ["Drafts", 24, "", "0,22 12,18 24,20 36,12 48,14 60,6 72,8"],
    ["Ready", 12, "", "0,20 12,16 24,18 36,10 48,12 60,8 72,4"],
    ["Waiting", 5, "", "0,8 12,14 24,10 36,16 48,12 60,18 72,14"],
    ["Sent", 86, "", "0,24 12,20 24,16 36,14 48,8 60,6 72,2"],
  ]
    .map(
      ([label, value, unit, pts]) => `<div class="metric"><small>${label}</small><b data-count="${value}" data-from="${(time.ui + 0.5).toFixed(2)}" data-unit="${unit}">0</b>${spark(pts)}</div>`,
    )
    .join("");
  const chats = [
    ["AM", "9:12", "Can we ship the spring launch today?"],
    ["JK", "9:16", plan.features[0]],
    ["AM", "9:21", "Hold Thursday. I want one more pass."],
    ["RS", "9:28", plan.features[1] || "The board is updated."],
    ["JK", "9:33", "Queued. I'll stay on the thread."],
  ]
    .map(([who, time, text]) => `<div class="msg"><i>${who}</i><p><b>${time}</b> ${esc(text)}</p></div>`)
    .join("");
  const cardFace = (title, i) => {
    const kind = ["doc", "board", "thread"][i % 3];
    const body =
      kind === "board"
        ? `<div class="mini">${[40, 70, 48, 86, 55, 30, 44].map((h) => `<b style="height:${h}%"></b>`).join("")}</div><small>Mon to Sun · 18 posts</small>`
        : kind === "thread"
          ? `<div class="bubble">${esc(plan.problem.slice(0, 80))}</div><div class="bubble me">Hold Thursday. One more pass.</div>`
          : `<u></u><s></s><s></s><em>${esc(title)}</em>`;
    return `<span>${["Draft", "This week", "Thread"][i % 3]}</span><h3>${esc(title)}</h3><div class="mock ${kind}">${body}</div>`;
  };
  const cards = plan.features.map((title, i) => `<article class="fcard">${cardFace(title, i)}</article>`).join("");
  const cluster = plan.features
    .map((title, i) => {
      const [x, y] = clusterSlots(plan.features.length, variant)[i];
      const depth = depthFor(i, 0);
      return `<article class="fcard" style="position:absolute;left:${x}px;top:${y}px" data-at="${(time.features + 0.2 + i * 0.16).toFixed(2)}" data-pop="${(time.features + 0.2 + i * 0.16).toFixed(2)}" data-depth="${depth.depth}" data-scale="${depth.scale}" data-z="${depth.z}" data-float="${(0.8 + i * 0.3).toFixed(2)}">${cardFace(title, i)}</article>`;
    })
    .join("");
  const steps = [
    { n: "01", title: plan.hook[0].slice(0, 2).map((w) => w.text).join(" "), sub: "The snag" },
    { n: "02", title: plan.name, sub: "The product" },
    { n: "03", title: "Go live", sub: plan.hostname },
  ]
    .map((s) => `<div class="step"><small>${s.n}</small><b>${esc(s.title)}</b><em>${esc(s.sub)}</em></div>`)
    .join("");

  const css = `
.url{color:${plan.accent}}
.kicker{font-size:26px;font-weight:500;opacity:0}
.product{font-weight:560;letter-spacing:-.06em;line-height:.95;color:${plan.ink}}
.nameRow{display:flex;align-items:center;gap:22px}
.swap{margin-top:22px;font-size:40px;font-weight:560;letter-spacing:-.04em;opacity:0;color:#fff}
.nameBlock{position:absolute;left:140px;top:460px;z-index:3;max-width:900px}
.nameBlock .letters{justify-content:flex-start}
.nameBlock .product{color:#fff}
.sideCard{position:absolute;left:1180px;top:500px;width:580px;background:#fff;color:${plan.ink};border-radius:28px;padding:40px;box-shadow:0 36px 90px rgba(0,0,0,.32);z-index:3;display:flex;flex-direction:column;gap:20px}
.sideCard small{font-size:22px;color:${plan.muted};font-weight:560}
.sideCard b{font-size:40px;letter-spacing:-.045em;font-weight:560;line-height:1.15}
.uiStage{transform-origin:50% 50%}
.window{width:1760px;height:960px;background:#fff;border-radius:28px;box-shadow:0 40px 100px rgba(0,0,0,.38);display:flex;overflow:hidden;position:relative}
.side{width:250px;background:linear-gradient(180deg, ${plan.accent}, ${plan.accentDeep});padding:18px 14px;display:flex;flex-direction:column;gap:6px;color:#fff}
.mark{display:flex;align-items:center;gap:10px;font-weight:560;letter-spacing:-.04em;font-size:22px;padding:6px 8px 16px;color:#fff}
.dot{width:12px;height:12px;border-radius:99px;background:#fff;flex:none}
.navbtn{height:46px;border-radius:10px;display:flex;align-items:center;padding:0 12px;color:rgba(255,255,255,.78);font-size:22px;font-weight:500}
.navbtn.on{background:rgba(255,255,255,.16);color:#fff}
.main{flex:1;display:flex;min-width:0}
.col{flex:1;display:flex;flex-direction:column;min-width:0}
.top{height:64px;border-bottom:1px solid ${plan.line};display:flex;align-items:center;gap:12px;padding:0 18px}
.lights{display:flex;gap:6px}.lights i{width:9px;height:9px;border-radius:99px;background:#E4E7EE}
.top b{font-size:22px;font-weight:560}.top small{color:${plan.muted};font-size:22px}
.search{margin-left:auto;background:${plan.bg};border-radius:10px;padding:8px 12px;color:${plan.muted};font-size:22px;min-width:180px}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px 16px 6px}
.metric{background:${plan.bg};border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.metric small{color:${plan.muted};font-size:22px}
.metric b{font-size:28px;letter-spacing:-.04em;font-weight:560}
.spark{width:72px;height:28px}
.list{padding:8px 16px;display:flex;flex-direction:column;gap:8px}
.row{height:78px;border:1px solid ${plan.line};border-radius:14px;display:flex;align-items:center;gap:12px;padding:0 14px;opacity:0;position:relative}
.row.hot.show{box-shadow:0 0 0 4px ${plan.accent}}
.bar b{transform-origin:bottom}
.row.hot{background:${plan.accentSoft};border-color:transparent}
.av{width:40px;height:40px;border-radius:99px;background:#fff;color:${plan.accent};display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:560;font-size:22px;flex:none;box-shadow:0 0 0 1px ${plan.line}}
.row span{display:flex;flex-direction:column;gap:2px;min-width:180px}
.row b{font-size:22px;font-weight:560;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px}
.row small{color:${plan.muted};font-size:22px}
.meter{width:96px;height:6px;border-radius:99px;background:#E4E7EE;flex:none;margin-left:auto}
.meter u{display:block;height:100%;border-radius:99px;background:${plan.accent};text-decoration:none}
.row em{margin-left:12px;font-style:normal;border-radius:99px;padding:4px 9px;font-size:22px;font-weight:560;flex:none}
.row em.before{color:${plan.accent};background:#fff}
.row em.after{display:none;color:#fff;background:${plan.accent}}
.row.show em.before{display:none}
.row.show em.after{display:inline}
.chart{flex:1;margin:6px 16px 14px;border:1px solid ${plan.line};border-radius:14px;display:flex;align-items:flex-end;gap:10px;padding:16px 16px 8px;min-height:120px}
.bar{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px}
.bar b{width:100%;background:${plan.accent};border-radius:6px 6px 2px 2px;display:block}
.bar:nth-child(odd) b{background:${plan.accentSoft}}
.bar small{color:${plan.muted};font-size:22px}
.sideR{width:360px;border-left:1px solid ${plan.line};display:flex;flex-direction:column;padding:16px;gap:8px}
.sideR strong{font-size:22px}
.msg{display:flex;gap:8px;align-items:flex-start}
.msg i{width:36px;height:36px;border-radius:99px;background:${plan.accentSoft};color:${plan.accent};display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:560;font-size:22px;flex:none}
.msg p{background:${plan.bg};border-radius:12px;padding:8px 10px;font-size:22px;line-height:1.35}
.msg b{font-weight:560;color:${plan.muted};margin-right:6px}
.composer{margin-top:auto;border:1px solid ${plan.line};border-radius:12px;padding:10px 12px;color:${plan.ink};font-size:22px}
.toast{position:absolute;right:28px;bottom:28px;background:${plan.ink};color:#fff;border-radius:12px;padding:12px 14px;font-size:22px;opacity:0;box-shadow:0 12px 30px rgba(13,18,34,.2)}
.head{position:absolute;top:92px;left:0;right:0;text-align:center;font-size:52px;font-weight:560;letter-spacing:-.05em;opacity:0}
.track{position:absolute;top:230px;left:0;display:flex;gap:28px}
.fcard{width:460px;height:420px;flex:none;background:#fff;border-radius:28px;box-shadow:0 0 0 1px ${plan.line},0 20px 50px rgba(13,18,34,.06);padding:28px;display:flex;flex-direction:column;gap:14px}
.fcard h3{font-size:30px;font-weight:560;letter-spacing:-.045em;line-height:1.05}
.fcard>span{color:${plan.accent};font-size:22px;font-weight:560;letter-spacing:.06em;text-transform:uppercase}
.mock{background:${plan.bg};border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px;min-height:240px;flex:1}
.mock u{height:8px;width:40%;background:${plan.accent};border-radius:99px}
.mock s{height:8px;background:#E4E7EE;border-radius:99px}
.mock em{background:${plan.accentSoft};border-radius:8px;padding:8px 10px;font-style:normal;font-size:22px}
.mini{display:flex;align-items:flex-end;gap:6px;height:120px}
.mini b{flex:1;background:${plan.accent};border-radius:6px 6px 2px 2px}
.mini b:nth-child(odd){background:${plan.accentSoft}}
.bubble{background:#fff;border-radius:12px;padding:8px 10px;font-size:22px}
.bubble.me{background:${plan.accentSoft}}
.fcard small{color:${plan.muted};font-size:22px}
.flowHead{font-size:48px;font-weight:560;letter-spacing:-.05em;opacity:0}
.rail{position:relative;width:980px;height:2px;background:${plan.line};margin:48px 0 28px}
#dot{position:absolute;top:50%;width:14px;height:14px;border-radius:99px;background:${plan.accent};transform:translate(-50%,-50%)}
.steps{display:flex;width:980px;justify-content:space-between}
.step{width:260px;display:flex;flex-direction:column;gap:6px;opacity:0}
.step small{color:${plan.accent};font-weight:560;font-size:22px}
.step b{font-size:34px;font-weight:560;letter-spacing:-.04em}
.step em{font-style:normal;color:${plan.muted};font-size:22px}
`;

  const body = `
<section class="scene" style="top:0;background:radial-gradient(120% 80% at 50% 120%, ${plan.accentDeep} 0%, #070b14 58%)" data-variant="${variant}">
  <div class="crop" data-slide="0.2" data-from="${dir.from}" data-to="${dir.to}" data-dur="2.6">${esc(plan.name)}</div>
  <div class="mid stack">${hook}</div>
</section>
<section class="scene" style="top:1080px;background:${plan.accentDeep}">
  <div class="crop" data-slide="${time.name}" data-from="${dir.to}" data-to="${dir.from}" data-dur="5.4">${esc(plan.name)}</div>
  <div class="nameBlock">
    <div class="kicker" data-at="${(time.name + 0.15).toFixed(2)}" data-tone="light">Introducing</div>
    <div class="product letters" data-punch="${(time.name + 0.45).toFixed(2)}" style="font-size:${plan.name.length > 10 ? 96 : plan.name.length > 7 ? 140 : 168}px">${letterLine(plan.name, time.name + 0.28, 0.045)}</div>
    <div class="swap" data-at="${(time.name + 1.05).toFixed(2)}" data-tone="light">${esc(plan.benefits[0])}</div>
  </div>
  ${miniUi(plan, (time.name + 1.5).toFixed(2))}
  <div class="wipe" style="background:${plan.accent}" data-wipe="${time.ui}"></div>
  <div class="sweep" data-a="${(time.name + 0.55).toFixed(2)}" data-b="${(time.name + 1.35).toFixed(2)}"></div>
</section>
<section class="scene" style="top:2160px;background:linear-gradient(145deg, ${plan.accentDeep}, ${plan.accent} 60%, ${plan.accentMid})"><div class="mid"><div id="uiStage" class="uiStage"><div class="window">
  <aside class="side"><div class="mark"><img class="logo" alt="" style="height:22px"><i class="dot"></i>${esc(plan.name)}</div>${navHtml}</aside>
  <div class="main">
    <div class="col">
      <div class="top"><span class="lights"><i></i><i></i><i></i></span><b>${esc(plan.name)}</b><small>${esc(plan.hostname)}</small><span class="search">Search posts</span></div>
      <div class="metrics">${metrics}</div>
      <div class="list">${rowHtml}</div>
      <div class="chart">${bars}</div>
    </div>
    <aside class="sideR"><strong>Thread · ${esc(plan.name)}</strong>${chats}<div class="composer">Reply<span class="caret"></span></div></aside>
  </div>
  <div id="toast" class="toast">Scheduled for Thursday, 2:00</div>
  <div id="cur" class="cursor" style="color:${plan.accent}"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 3 L5 19 L10 15 L14 21 L17 19 L13 13 L19 13 Z" fill="#0D1222"/></svg><i id="ring" class="ring"></i></div>
</div></div></div></section>
<section class="scene" style="top:3240px">
  <div class="head" data-at="${(time.features + 0.08).toFixed(2)}" data-tone="ink">What it does</div>
  ${variant === 0 ? `<div id="track" class="track">${cards}</div>` : `<div class="crop ink" style="top:80px" data-slide="${time.features}" data-from="${dir.from}" data-to="${dir.to}" data-dur="3">${esc(plan.name)}</div>${cluster}`}
</section>
<section class="scene" style="top:4320px"><div class="mid">
  <div class="flowHead" data-at="${(time.flow + 0.1).toFixed(2)}" data-tone="ink">How it comes together</div>
  <div class="rail"><i id="dot"></i></div>
  <div class="steps">${steps}</div>
</div></section>
${endScene(plan, 5400, time.cta)}`;

  const per = time.span / Math.max(plan.features.length, 1);
  const state = {
    grey: plan.grey,
    ink: plan.ink,
    slide: time.slide,
    end: time.end,
    stops: [0, time.name, time.ui, time.features, time.flow, time.cta].map((t, i) => ({ t, y: i * 1080 })),
    ui: time.ui,
    features: time.features,
    per,
    flow: time.flow,
    logo: plan.logo,
    n: plan.features.length,
  };
  const extra = `
function extra(t) {
  const p = q5(seg(t, STATE.ui, STATE.ui + 0.7));
  const push = q5(seg(t, STATE.ui + 2.3, STATE.ui + 3.5));
  $("uiStage").style.transformOrigin = "640px 420px";
  $("uiStage").style.transform = "scale(" + lerp(lerp(0.94, 1, p), 1.16, push).toFixed(3) + ")";
  document.querySelectorAll(".bar b").forEach((el, i) => {
    const g = eo(seg(t, STATE.ui + 0.35 + i * 0.1, STATE.ui + 1.15 + i * 0.1));
    el.style.transform = "scaleY(" + g.toFixed(3) + ")";
  });
  document.querySelectorAll(".row").forEach((el) => {
    el.style.opacity = String(eo(seg(t, +el.dataset.at, +el.dataset.at + 0.32)));
  });
  $("toast").style.opacity = String(eo(seg(t, STATE.ui + 3.4, STATE.ui + 3.7)));
  const active = t > STATE.ui + 3.2 ? 1 : 0;
  document.querySelectorAll(".navbtn").forEach((el, i) => el.classList.toggle("on", i === active));
  const c1 = t < STATE.ui + 1.05 ? 0 : q5(seg(t, STATE.ui + 1.05, STATE.ui + 1.85));
  $("cur").style.left = lerp(280, 640, c1) + "px";
  $("cur").style.top = lerp(180, 310, c1) + "px";
  const pressing = t >= STATE.ui + 1.85 && t < STATE.ui + 2.05;
  $("cur").style.transform = "scale(" + (pressing ? 0.82 : 1) + ")";
  const click = seg(t, STATE.ui + 1.85, STATE.ui + 2.2);
  $("ring").style.opacity = String(click > 0 && click < 1 ? 1 - click : 0);
  const hot = document.querySelector(".row.hot");
  if (hot) hot.classList.toggle("show", t > STATE.ui + 2.05);
  $("toast").style.opacity = String(eo(seg(t, STATE.ui + 2.1, STATE.ui + 2.4)));
  const track = $("track");
  if (track) {
    const n = track.querySelectorAll(".fcard").length || 1;
    let idx = 0;
    for (let i = 1; i < n; i++) {
      const at = STATE.features + i * STATE.per;
      if (t < at - 0.45) break;
      idx = i - 1 + q5(seg(t, at - 0.45, at));
    }
    track.style.transform = "translateX(" + ((1920 - 460) / 2 - idx * 488) + "px)";
  }
  document.querySelectorAll(".step").forEach((el, i) => {
    const at = STATE.flow + 0.35 + i * 0.55;
    el.style.opacity = String(eo(seg(t, at, at + 0.35)));
  });
  $("dot").style.left = (16 + q5(seg(t, STATE.flow + 0.4, STATE.flow + 2.4)) * 68) + "%";
}`;

  const events = [
    cue(plan.hook[0][0].at, "tick", { gain: -8 }),
    plan.hook[1]?.[0] ? cue(plan.hook[1][0].at, "tick", { gain: -10 }) : null,
    cue(time.name, "whoosh", { align: "peak", gain: -2 }),
    cue(time.name + 0.45, "ui", { gain: -8 }),
    cue(time.name + 1.05, "tick", { gain: -8 }),
    cue(time.name + 1.7, "tick", { gain: -7 }),
    cue(time.name + 2.55, "tick", { gain: -8 }),
    cue(time.ui, "whoosh", { align: "peak", gain: -2 }),
    cue(time.ui + 0.7, "ui", { gain: -6 }),
    cue(time.ui + 2.15, "click", { gain: -5 }),
    cue(time.features, "whoosh", { align: "peak", gain: -2 }),
    ...plan.features.map((_, i) => cue(time.features + i * per + 0.05, "click", { gain: -8 })),
    cue(time.flow, "whoosh", { align: "peak", gain: -2 }),
    cue(time.flow + 0.4, "tick", { gain: -8 }),
    cue(time.flow + 1.0, "tick", { gain: -8 }),
    cue(time.cta, "whoosh", { align: "peak", gain: -1 }),
    cue(time.cta + 0.25, "chime", { gain: -6 }),
    cue(time.cta + 0.55, "thud", { gain: -4 }),
  ].filter(Boolean);

  return {
    html: page({ font: opts.fontUrl, css, body, state, extra, accent: plan.accent }),
    duration: time.end,
    events,
    hostname: plan.hostname,
    template: "launch",
  };
}
