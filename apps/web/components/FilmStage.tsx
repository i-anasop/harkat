"use client";

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import s from "./FilmStage.module.css";

export type Cue = { t: number; sfx: string };

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

export type FilmHandle = { replay: () => void };

const FilmStage = forwardRef<FilmHandle, { html: string; duration: number; events: Cue[]; autoPlay?: boolean }>(function FilmStage({ html, duration, events, autoPlay = false }, ref) {
  const id = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const playRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const started = useRef(false);

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

  const play = useCallback((from = 0) => {
    window.dispatchEvent(new CustomEvent("harkat-play", { detail: id }));
    cancelAnimationFrame(playRef.current);
    audioRef.current?.close().catch(() => {});
    const ctx = new AudioContext();
    audioRef.current = ctx;
    ctx.resume().catch(() => {});
    const startAt = ctx.currentTime + 0.06;
    for (const cue of events) if (cue.t >= from) schedule(ctx, cue, startAt + (cue.t - from));
    const started = performance.now() - from * 1000;
    setPlaying(true);
    const tick = (now: number) => {
      const t = (now - started) / 1000;
      if (t >= duration) {
        seek(0);
        setPlaying(false);
        ctx.close().catch(() => {});
        audioRef.current = null;
        return;
      }
      seek(t);
      playRef.current = requestAnimationFrame(tick);
    };
    playRef.current = requestAnimationFrame(tick);
  }, [duration, events, id]);

  useImperativeHandle(ref, () => ({ replay: () => play(0) }), [play]);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;
    const fit = () => { frame.style.transform = `scale(${stage.clientWidth / 1920})`; };
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    fit();
    return () => ro.disconnect();
  }, [html]);

  useEffect(() => {
    const onOther = (e: Event) => { if ((e as CustomEvent).detail !== id) stop(); };
    window.addEventListener("harkat-play", onOther);
    return () => {
      window.removeEventListener("harkat-play", onOther);
      cancelAnimationFrame(playRef.current);
      audioRef.current?.close().catch(() => {});
    };
  }, [id]);

  return (
    <div className={s.wrap}>
      <div className={s.stage} ref={stageRef}>
        <iframe
          ref={frameRef}
          title="Sample film"
          sandbox="allow-scripts"
          srcDoc={html}
          onLoad={() => {
            seek(0);
            if (autoPlay && !started.current) {
              started.current = true;
              play(0);
            }
          }}
        />
        <button type="button" className={s.play} onClick={() => (playing ? stop() : play(at > duration - 0.2 ? 0 : at))}>
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <input className={s.scrub} type="range" min={0} max={duration} step={0.05} value={Math.min(at, duration)} aria-label="Film time" onChange={(e) => { stop(); seek(Number(e.target.value)); }} />
    </div>
  );
});

export default FilmStage;
