"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "@/components/icons";
import { FILMS, SHOW_POND_WORK, filmLoop, filmPoster, type Film } from "@/lib/site";
import s from "./work.module.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "launch", label: "Launch films" },
  { key: "product", label: "Product" },
  { key: "announcement", label: "Announcements" },
] as const;

type Key = (typeof FILTERS)[number]["key"];

// In-design animated placeholders, shown until Pond films are approved.
function Placeholder({ slug }: { slug: string }) {
  switch (slug) {
    case "pond-for-ai-agents":
      return <span className={s.t44}>Introducing<br /><span style={{ color: "#1F33B0" }}>Pond for AI Agents</span></span>;
    case "meet-pond-ai":
      return <span className={s.t44} style={{ lineHeight: "normal" }}>Meet <span style={{ color: "#2E4BDB" }}>Pond AI.</span></span>;
    case "pond-bot-launch":
      return (
        <div className={s.notif}>
          <span className={s.avatar}>PB</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Pond Bot</span>
            <span style={{ fontSize: 13, color: "#3C4253" }}>Here are AI agent ideas for you.</span>
          </span>
        </div>
      );
    default:
      return (
        <div className={s.chat}>
          <span className={s.bubbleIn}>Book Tuesday morning?</span>
          <span className={s.bubbleOut}>Booked — 10:30 AM</span>
        </div>
      );
  }
}

const SOFT = new Set(["pond-for-ai-agents", "whatsapp-booking-agent"]);

function Card({ film }: { film: Film }) {
  const meta = (
    <span className={s.meta}>
      <span className={s.kindRow}><span className={s.kind}>{film.kind}</span><span className={s.dur}>{film.duration}</span></span>
      <span className={s.title}>{film.title}</span>
      <span className={s.about}>{film.about}</span>
    </span>
  );
  if (!SHOW_POND_WORK) {
    return (
      <Link href="/docs/pond-ai" className={s.card}>
        <div className={`${s.thumb} ${SOFT.has(film.slug) ? "soft" : ""}`} style={SOFT.has(film.slug) ? undefined : { background: "#FFFFFF" }}>
          <Placeholder slug={film.slug} />
        </div>
        {meta}
      </Link>
    );
  }
  // Opens the film in the player box (FilmPlayer); the thumbnail previews a short loop on hover.
  return (
    <button
      type="button"
      className={s.card}
      data-watch={film.slug}
      aria-label={`Watch ${film.title}`}
      onMouseEnter={(e) => { e.currentTarget.querySelector("video")?.play().catch(() => {}); }}
      onMouseLeave={(e) => { const v = e.currentTarget.querySelector("video"); if (v) v.pause(); }}
    >
      <div className={s.thumb}>
        <video className={s.video} src={filmLoop(film.slug)} poster={filmPoster(film.slug)} muted loop playsInline preload="none" aria-hidden="true" />
        <span className={s.watch}><span className={s.watchIcon}><Play /></span><span className={s.watchLabel}>Watch film</span></span>
      </div>
      {meta}
    </button>
  );
}

export default function WorkGrid() {
  const [filter, setFilter] = useState<Key>("all");
  const films = filter === "all" ? FILMS : FILMS.filter((f) => f.tags.includes(filter));
  return (
    <>
      <div className={s.toolbar}>
        <div className={s.filters}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} className={s.filter} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <span className={s.client}>
          Client
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/pond-ai-logo.png" alt="Pond AI" style={{ height: 20, width: "auto" }} />
        </span>
      </div>
      <section className={s.grid}>
        {films.map((f) => <Card key={f.slug} film={f} />)}
      </section>
    </>
  );
}
