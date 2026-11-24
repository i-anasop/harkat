"use client";

import { useEffect, useRef, useState } from "react";
import s from "./studio.module.css";

type Cue = { t: number; sfx: string };
type Film = { html: string; duration: number; events: Cue[]; goal?: string; length?: number };

const tone = (ctx: AudioContext, when: number, freq: number, dur: number, gain = 0.08, type: OscillatorType = "sine") => {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(when);
  o.stop(when + dur + 0.02);
};

function schedule(ctx: AudioContext, cue: Cue, when: number) {
  if (cue.sfx === "whoosh") {
    const n = Math.floor(ctx.sampleRate * 0.45);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const p = i / n;
      lp += (0.05 + p * 0.4) * (Math.random() * 2 - 1 - lp);
      data[i] = lp * Math.sin(Math.PI * p) * 0.7;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.2;
    src.connect(g);
    g.connect(ctx.destination);
    src.start(when);
    return;
  }
  if (cue.sfx === "tick") tone(ctx, when, 2100, 0.05, 0.05);
  else if (cue.sfx === "click") tone(ctx, when, 180, 0.04, 0.07, "square");
  else if (cue.sfx === "ui") tone(ctx, when, 660, 0.12, 0.06);
  else if (cue.sfx === "chime") tone(ctx, when, 880, 0.4, 0.06);
  else if (cue.sfx === "thud") tone(ctx, when, 95, 0.28, 0.12);
}

export default function Studio() {
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");
  const [audience, setAudience] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [proof, setProof] = useState("");
  const [accent, setAccent] = useState("#2E4BDB");
  const [accentSet, setAccentSet] = useState(false);
  const [url, setUrl] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [goal, setGoal] = useState("launch");
  const [tone, setTone] = useState("plain");
  const [length, setLength] = useState<15 | 30 | 45>(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [film, setFilm] = useState<Film | null>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const orderRef = useRef<HTMLAnchorElement>(null);
  const playRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const features = featuresText.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 4);

  useEffect(() => {
    const fit = () => {
      const stage = stageRef.current;
      const frame = frameRef.current;
      if (!stage || !frame) return;
      frame.style.transform = `scale(${stage.clientWidth / 1920})`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [film]);

  const stop = () => {
    cancelAnimationFrame(playRef.current);
    setPlaying(false);
    audioRef.current?.close().catch(() => {});
    audioRef.current = null;
  };

  const seek = (t: number) => {
    frameRef.current?.contentWindow?.postMessage({ type: "harkat-t", t }, "*");
    setAt(t);
  };

  const play = (from = 0) => {
    if (!film) return;
    cancelAnimationFrame(playRef.current);
    audioRef.current?.close().catch(() => {});
    const ctx = new AudioContext();
    audioRef.current = ctx;
    const startAt = ctx.currentTime + 0.06;
    for (const cue of film.events) if (cue.t >= from) schedule(ctx, cue, startAt + (cue.t - from));
    const started = performance.now() - from * 1000;
    setPlaying(true);
    const tick = (now: number) => {
      const t = (now - started) / 1000;
      if (t >= film.duration) {
        seek(0);
        setPlaying(false);
        ctx.close().catch(() => {});
        return;
      }
      seek(t);
      playRef.current = requestAnimationFrame(tick);
    };
    playRef.current = requestAnimationFrame(tick);
  };

  const preview = async () => {
    setBusy(true);
    setError("");
    stop();
    try {
      const res = await fetch("/api/studio/film", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, problem, oneLiner: problem, audience, features, proof, accent, accentSet, url, logo, sample: true, goal, tone, length }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFilm(null);
        setError(data.reason || "That preview didn’t come through. Please try again.");
        return;
      }
      if (data.accent && !accentSet) setAccent(data.accent);
      setFilm({ html: data.html, duration: data.duration, events: data.events, goal: data.goal, length: data.length });
      setAt(0);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const order = () => {
    const notes = ["From the studio preview", `Problem: ${problem.trim()}`, audience.trim() && `Audience: ${audience.trim()}`, `Goal: ${goal}`, `Length: ${length}s`, "Features:", ...features.map((f) => `- ${f}`), proof.trim() && `Proof: ${proof.trim()}`, `Colour: ${accent}`].filter(Boolean).join("\n");
    sessionStorage.setItem("harkat.studioBrief", JSON.stringify({ name: name.trim(), url: url.trim(), problem: problem.trim(), notes, accent }));
    orderRef.current?.click();
  };

  const onLogo = (file: File | undefined) => {
    setError("");
    if (!file) return setLogo(null);
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setError("Use a PNG, JPG, WEBP or SVG logo. No photos of people.");
    if (file.size > 80_000) return setError("That logo is too big. Use a file under 80 KB.");
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className={s.layout}>
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); preview(); }}>
        <label className={s.field}><span>Product name</span><input className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Keel" maxLength={48} /></label>
        <label className={s.field}><span>One-liner</span><input className={s.input} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Reviews stall before the launch ships." maxLength={180} /></label>
        <label className={s.field}><span>Audience, optional</span><input className={s.input} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Developers" maxLength={48} /></label>
        <label className={s.field}><span>What it does, one per line</span><textarea className={s.area} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder={"Types the change\nFinds the bug\nShows the diff"} maxLength={320} /></label>
        <label className={s.field}><span>Proof stat, optional</span><input className={s.input} value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Up to 98%" maxLength={32} /></label>
        <div className={s.field}>
          <span>Goal</span>
          <div className={s.looks}>
            {[["launch", "Launch"], ["feature", "Feature"], ["explainer", "Explainer"]].map(([id, label]) => (
              <button key={id} type="button" className={goal === id ? s.lookOn : s.look} onClick={() => setGoal(id)}>{label}</button>
            ))}
          </div>
        </div>
        <div className={s.field}>
          <span>Tone</span>
          <div className={s.looks}>
            {[["quiet", "Quiet"], ["plain", "Plain"], ["bold", "Bold"]].map(([id, label]) => (
              <button key={id} type="button" className={tone === id ? s.lookOn : s.look} onClick={() => setTone(id)}>{label}</button>
            ))}
          </div>
        </div>
        <div className={s.field}>
          <span>Length</span>
          <div className={s.looks}>
            {([15, 30, 45] as const).map((n) => (
              <button key={n} type="button" className={length === n ? s.lookOn : s.look} onClick={() => setLength(n)}>{n}s</button>
            ))}
          </div>
        </div>
        <label className={s.field}>
          <span>Brand colour</span>
          <span className={s.color}>
            <input type="color" value={accent} onChange={(e) => { setAccent(e.target.value); setAccentSet(true); }} aria-label="Brand colour" />
            <input className={s.input} value={accent} onChange={(e) => { setAccent(e.target.value); setAccentSet(true); }} maxLength={7} aria-label="Hex colour" />
          </span>
        </label>
        <label className={s.field}><span>Product URL</span><input className={s.input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="keel.example" inputMode="url" /></label>
        <label className={s.field}><span>Logo, optional</span><input className={s.file} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => onLogo(e.target.files?.[0])} /></label>
        <p className={s.note}>The picture in the film is a sample interface, labelled as one. Sound is effects only. Harkat never adds music. The film you pay for is still finished by us.</p>
        {error && <p className={s.err} role="alert">{error} {/doesn.t make films/.test(error) && <> <a href="/docs/halal">Why we decline some work</a></>}</p>}
        <div className={s.actions}>
          <button className={`btn ${s.primary}`} type="submit" disabled={busy}><span>{busy ? "Cutting…" : "Watch a preview"}</span><i /></button>
          <button className={s.ghost} type="button" disabled={!film} onClick={order}>Order this film</button>
          <a ref={orderRef} href="#order" hidden>Order</a>
        </div>
      </form>

      <div className={s.stageWrap}>
        <div className={s.stage} ref={stageRef}>
          {film ? (
            <iframe ref={frameRef} title="Sample film preview" sandbox="allow-scripts allow-same-origin" srcDoc={film.html} onLoad={() => seek(0)} />
          ) : (
            <div className={s.empty}>Your preview will play here.</div>
          )}
          {film && <button type="button" className={s.play} onClick={() => (playing ? stop() : play(at > film.duration - 0.2 ? 0 : at))}>{playing ? "Pause" : "Play"}</button>}
        </div>
        {film && (
          <>
            <input className={s.scrub} type="range" min={0} max={film.duration} step={0.05} value={at} aria-label="Film time" onChange={(e) => { stop(); seek(Number(e.target.value)); }} />
            <p className={s.note}>{film.length ? `${film.length}s ` : ""}{film.goal ?? "launch"}. A sample cut, not the finished film. Sound is effects only.</p>
          </>
        )}
      </div>
    </div>
  );
}
