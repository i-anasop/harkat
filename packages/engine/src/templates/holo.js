import { base, cue, esc, lastAt, letterLine, lineHtml } from "../copy.js";
import { constellation, depthFor, layoutVariant, slideDir } from "../layout.js";
import { endScene, miniUi, page } from "../shell.js";

/**
 * Light launch, distilled from "Introducing Pond for AI Agents":
 * a gradient pill, a huge one-hue word, a glass prompt, then cards
 * around the name. No tilted cards, no second hue, no invented numbers.
 */
export function holoFilm(brief, opts = {}) {
  const plan = base(brief);
  const last = lastAt(plan.hook);
  const word = Math.max(3.4, +(last + 0.9).toFixed(2));
  const shift = word - 3.4;
  const glass = +(7.6 + shift).toFixed(2);
  const cards = +(12.4 + shift).toFixed(2);
  const cta = +(28.2 + shift).toFixed(2);
  const end = +(cta + 4.15).toFixed(2);
  const slide = 0.7;

  const hook = plan.hook
    .map((line) => `<div class="line" style="font-size:${Math.min(plan.hookSize, 64)}px">${lineHtml(line, "light")}</div>`)
    .join("");
  const variant = layoutVariant(brief);
  const dir = slideDir(variant);
  const heroIndex = 2;
  const tiles = [
    { kicker: plan.features[0], title: "To Maya Chen", body: `<p class="quiet">${esc(plan.problem)}</p>`, wash: true },
    { kicker: plan.features[1], title: "Open threads", body: `<div class="threads"><div><i>MC</i><span><b>Maya Chen</b><small>9:41 · Follow-up</small></span></div><div><i>JO</i><span><b>Jules Okonkwo</b><small>8:15 · Waiting</small></span></div></div>` },
    { kicker: plan.features[2], title: "Thursday, 2:00", body: `<p class="quiet">Nothing goes out until you say so. The draft stays in the thread until you approve it.</p><em id="approve" class="approve">Approve</em>`, wash: true },
    { kicker: "Follow-up", title: "Maya Chen", body: `<p class="quiet">9:41 · The thread is still open</p>` },
    { kicker: "Waiting", title: "Jules Okonkwo", body: `<p class="quiet">8:15 · Held since this morning</p>`, wash: true },
    { kicker: "Sent", title: "Ari Rahman", body: `<p class="quiet">Yesterday · Already sent</p>` },
    { kicker: "Today", title: "Drafts", body: `<b class="big" data-count="12" data-from="${(cards + 0.8).toFixed(2)}">0</b><p class="quiet">Drafts waiting today</p>`, wash: true },
    { kicker: "On you", title: "Waiting", body: `<b class="big" data-count="6" data-from="${(cards + 1.1).toFixed(2)}">0</b><p class="quiet">Waiting on you</p>` },
  ];
  const slots = constellation(tiles.length, variant, heroIndex);
  const cardHtml = tiles
    .map((tile, i) => {
      const [x, y] = slots[i];
      const depth = depthFor(i, heroIndex);
      const hero = i === heroIndex;
      return `<article class="hcard${hero ? " hero" : ""}${tile.wash ? " wash" : ""}" style="left:${x}px;top:${y}px" data-at="${(cards + 0.12 + i * 0.1).toFixed(2)}" data-pop="${(cards + 0.12 + i * 0.1).toFixed(2)}" data-depth="${depth.depth}" data-scale="${depth.scale}" data-z="${depth.z}" data-float="${(0.6 + (i % 5) * 0.2).toFixed(2)}">
        <small>${esc(tile.kicker)}</small>
        <h3>${esc(tile.title)}</h3>
        ${tile.body}
      </article>`;
    })
    .join("");
  const heroSlot = slots[heroIndex];

  const css = `
.pill{padding:28px 48px;border-radius:999px;background:linear-gradient(100deg, ${plan.accentMid}, ${plan.accent} 45%, ${plan.accentDeep});box-shadow:0 20px 60px rgba(13,18,34,.12)}
.nameBlock{position:absolute;left:140px;top:480px;z-index:3}
.nameBlock .letters{justify-content:flex-start}
.nameBlock .giant span{background:none;color:#fff;-webkit-text-fill-color:#fff}
.sideCard{position:absolute;left:1180px;top:480px;width:560px;background:#fff;color:${plan.ink};border-radius:28px;padding:36px;box-shadow:0 36px 90px rgba(0,0,0,.32);z-index:3;display:flex;flex-direction:column;gap:16px}
.sideCard b{font-size:36px;letter-spacing:-.04em;line-height:1.15}
.sideCard small{font-size:22px;color:${plan.muted}}
.swap{margin-top:18px;font-size:36px;font-weight:560;letter-spacing:-.04em;color:#fff}
.giant{font-weight:560;letter-spacing:-.07em;line-height:.9}
.giant span{background:linear-gradient(100deg, ${plan.accentDeep}, ${plan.accent} 40%, ${plan.accentMid});-webkit-background-clip:text;background-clip:text;color:transparent}
.field{background:radial-gradient(90% 80% at 18% 10%, ${plan.accentMid} 0%, ${plan.accent} 46%, ${plan.accentDeep} 100%)}
.glass{width:920px;height:92px;border-radius:999px;background:rgba(255,255,255,.88);box-shadow:0 16px 50px rgba(13,18,34,.12);display:flex;align-items:center;padding:0 18px 0 32px;gap:16px}
.glass p{flex:1;font-size:28px;font-weight:500;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0}
.send{width:64px;height:64px;border-radius:99px;background:#fff;color:${plan.accent};display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 0 0 1px rgba(13,18,34,.06)}
.chip{margin-top:22px;background:#fff;color:${plan.accent};border-radius:99px;padding:10px 16px;font-size:22px;font-weight:560;opacity:0}
.hcard{position:absolute;width:340px;height:auto;background:#fff;color:${plan.ink};border-radius:24px;box-shadow:0 18px 50px rgba(13,18,34,.16);padding:22px;display:flex;flex-direction:column;gap:10px;opacity:0}
.hcard.hero{width:480px;height:auto;padding:28px;gap:16px;box-shadow:0 36px 90px rgba(13,18,34,.28)}
.hcard.wash{background:linear-gradient(165deg, ${plan.accent} 0%, ${plan.accentDeep} 100%);color:#fff}
.hcard.wash h3,.hcard.wash p,.hcard.wash b,.hcard.wash small,.hcard.wash span{color:#fff}
.hcard.wash small{color:rgba(255,255,255,.78)}
.hcard small{font-size:22px;font-weight:560;letter-spacing:.08em;text-transform:uppercase;color:${plan.accent}}
.hcard h3{font-size:32px;font-weight:560;letter-spacing:-.04em;line-height:1.05;color:${plan.ink};min-height:48px}
.hcard p{min-height:180px}
.hcard.hero p{min-height:160px}
.hcard.hero h3{font-size:48px}
.hcard.hero{box-shadow:0 36px 90px rgba(13,18,34,.28)}
.big{font-size:72px;letter-spacing:-.05em;line-height:.9}
.quiet{font-size:22px;line-height:1.35;color:${plan.muted}}
.hcard .stat{margin-top:12px;display:flex;flex-direction:column;gap:4px}
.hcard .stat b{font-size:84px;letter-spacing:-.06em;line-height:.9}
.mail p{font-size:22px;line-height:1.35;margin:0}
.hcard.wash .quiet{color:rgba(255,255,255,.82)}
.approve{margin-top:12px;align-self:stretch;text-align:center;font-style:normal;background:#fff;color:${plan.accentDeep};border-radius:14px;padding:16px 24px;font-weight:560;font-size:26px;min-height:64px}
.who{display:flex;gap:12px;align-items:center;margin-top:8px}
.who i{width:44px;height:44px;border-radius:99px;background:${plan.accentSoft};color:${plan.accent};display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:560}
.hcard.wash .who i{background:rgba(255,255,255,.16);color:#fff}
.who span{font-size:22px;line-height:1.35}
.nmeter{margin-top:auto;height:8px;border-radius:99px;background:rgba(13,18,34,.08)}
.hcard.wash .nmeter{background:rgba(255,255,255,.2)}
.nmeter u{display:block;height:100%;border-radius:99px;background:${plan.accent};text-decoration:none}
.hcard.wash .nmeter u{background:#fff}
.threads{display:flex;flex-direction:column;gap:10px}
.threads div{display:flex;gap:10px;align-items:center}
.threads i{width:44px;height:44px;border-radius:99px;background:${plan.accentSoft};color:${plan.accent};display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:560;font-size:22px}
.threads b{font-size:26px}
.threads span{display:flex;flex-direction:column}
.threads small{letter-spacing:0;text-transform:none;font-weight:500;color:${plan.muted};font-size:22px}
.approve em{font-style:normal;background:#fff;color:${plan.accentDeep};border-radius:12px;padding:10px 16px;font-weight:560}
.centerWord{position:absolute;left:120px;top:380px;z-index:12;font-size:168px;font-weight:560;letter-spacing:-.06em;color:${plan.ink}}
.centerWord.letters{justify-content:flex-start}
`;

  const body = `
<section class="scene" style="top:0"><div class="mid"><div class="pill">${hook}</div></div></section>
<section class="scene" style="top:1080px;background:linear-gradient(145deg, ${plan.accentDeep}, ${plan.accent})" data-variant="${variant}">
  <div class="crop" data-slide="${word}" data-from="${dir.from}" data-to="${dir.to}" data-dur="2.8">${esc(plan.name)}</div>
  <div class="nameBlock">
  <img class="logo" alt="">
  <div class="giant letters" data-punch="${(word + 0.35).toFixed(2)}" style="font-size:${plan.name.length > 10 ? 120 : 150}px;color:#fff">${letterLine(plan.name, word + 0.2, 0.05)}</div>
  <div class="swap" data-at="${(word + 1.1).toFixed(2)}" data-tone="light">${esc(plan.benefits[0] || plan.name)}</div>
  </div>
  ${miniUi(plan, (word + 1.5).toFixed(2))}
  <div class="wipe" style="background:${plan.accent}" data-wipe="${glass}"></div>
  <div class="sweep" data-a="${(word + 0.45).toFixed(2)}" data-b="${(word + 1.3).toFixed(2)}"></div>
</section>
<section class="scene field" style="top:2160px"><div class="mid">
  <div class="glass">
    <p data-at="${(glass + 0.3).toFixed(2)}" data-tone="ink">${esc(plan.problem)}</p>
    <div class="send">↑</div>
  </div>
  <div id="chip" class="chip">Queued</div>
  <div id="cur" class="cursor" style="color:#fff"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 3 L5 19 L10 15 L14 21 L17 19 L13 13 L19 13 Z" fill="#0D1222"/></svg><i id="ring" class="ring"></i></div>
</div></section>
<section class="scene" style="top:3240px;background:linear-gradient(160deg, ${plan.accentSoft}, #fff 45%)">
  <div id="ringStage">
  <div class="crop ink" style="top:80px;font-size:640px" data-slide="${cards}" data-from="${dir.to}" data-to="${dir.from}" data-dur="3.2">${esc(plan.name)}</div>
  <div class="centerWord letters">${letterLine(plan.name, cards + 0.05, 0.04)}</div>
  ${cardHtml}
  <div id="cur2" class="cursor" style="color:${plan.accent}"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 3 L5 19 L10 15 L14 21 L17 19 L13 13 L19 13 Z" fill="#0D1222"/></svg><i id="ring2" class="ring"></i></div>
  </div>
</section>
${endScene(plan, 4320, cta)}`;

  const state = {
    grey: plan.grey,
    ink: plan.ink,
    slide,
    end,
    stops: [0, word, glass, cards, cta].map((t, i) => ({ t, y: i * 1080 })),
    glass,
    cards,
    hit: +(cards + 3.2).toFixed(2),
    heroX: heroSlot[0] + 230,
    heroY: heroSlot[1] + 190,
    heroBtnX: heroSlot[0] + 110,
    heroBtnY: heroSlot[1] + 300,
    logo: plan.logo,
  };
  const extra = `
function extra(t) {
  const move = q5(seg(t, STATE.glass + 0.8, STATE.glass + 1.55));
  $("cur").style.left = lerp(700, 1340, move) + "px";
  $("cur").style.top = lerp(640, 520, move) + "px";
  const pressing = t >= STATE.glass + 1.55 && t < STATE.glass + 1.75;
  $("cur").style.transform = "scale(" + (pressing ? 0.82 : 1) + ")";
  const click = seg(t, STATE.glass + 1.55, STATE.glass + 1.9);
  $("ring").style.opacity = String(click > 0 && click < 1 ? 1 - click : 0);
  $("chip").style.opacity = String(eo(seg(t, STATE.glass + 1.7, STATE.glass + 2.05)));
  const push = q5(seg(t, STATE.cards + 0.9, STATE.cards + 2.15));
  const stage = $("ringStage");
  if (stage) {
    stage.style.transformOrigin = STATE.heroX + "px " + STATE.heroY + "px";
    stage.style.transform = "scale(" + lerp(1, 1.55, push).toFixed(3) + ")";
  }
  document.querySelectorAll(".hcard:not(.hero)").forEach((el) => {
    const base = parseFloat(el.style.opacity || "1");
    el.style.opacity = String(base * (1 - push * 0.92));
  });
  const word = document.querySelector(".centerWord");
  if (word) word.style.opacity = String(1 - push);
  const move2 = q5(seg(t, STATE.cards + 2.2, STATE.cards + 3.15));
  $("cur2").style.opacity = String(eo(seg(t, STATE.cards + 2.15, STATE.cards + 2.45)));
  $("cur2").style.left = lerp(STATE.heroX - 180, STATE.heroBtnX, move2) + "px";
  $("cur2").style.top = lerp(STATE.heroY - 40, STATE.heroBtnY, move2) + "px";
  const pressing2 = t >= STATE.hit && t < STATE.hit + 0.18;
  $("cur2").style.transform = "scale(" + (pressing2 ? 0.82 : 1) + ")";
  const click2 = seg(t, STATE.hit, STATE.hit + 0.35);
  $("ring2").style.opacity = String(click2 > 0 && click2 < 1 ? 1 - click2 : 0);
  const btn = document.getElementById("approve");
  if (btn && t > STATE.hit) btn.textContent = "Approved";
}`;

  const events = [
    cue(plan.hook[0][0].at, "tick", { gain: -8 }),
    plan.hook[1]?.[0] ? cue(plan.hook[1][0].at, "tick", { gain: -10 }) : null,
    cue(word, "whoosh", { align: "peak", gain: -2 }),
    cue(word + 0.35, "ui", { gain: -8 }),
    cue(word + 1.1, "tick", { gain: -8 }),
    cue(word + 1.7, "tick", { gain: -7 }),
    cue(glass, "whoosh", { align: "peak", gain: -2 }),
    cue(glass + 1.6, "click", { gain: -5 }),
    cue(cards, "whoosh", { align: "peak", gain: -2 }),
    cue(cards + 0.9, "ui", { gain: -8 }),
    cue(cards + 2.2, "tick", { gain: -8 }),
    cue(cards + 3.2, "click", { gain: -5 }),
    ...plan.features.slice(0, 4).map((_, i) => cue(cards + 0.25 + i * 0.7, "tick", { gain: -9 })),
    cue(cta, "whoosh", { align: "peak", gain: -1 }),
    cue(cta + 0.25, "chime", { gain: -6 }),
    cue(cta + 0.55, "thud", { gain: -4 }),
  ].filter(Boolean);

  return { html: page({ font: opts.fontUrl, css, body, state, extra, accent: plan.accent }), duration: end, events, hostname: plan.hostname, template: "holo" };
}
