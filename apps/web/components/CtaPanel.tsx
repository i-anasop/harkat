import { GlassButton, LightButton } from "./Buttons";
import FilmPreview from "./FilmPreview";
import { Grain } from "./icons";
import { CONTACT_EMAIL, FILMS, SHOW_POND_WORK, filmPoster } from "@/lib/site";
import s from "./CtaPanel.module.css";

function Tile({ slug }: { slug: string }) {
  return (
    <span className={s.tile}>
      <span className={s.thumb}>
        {SHOW_POND_WORK ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={filmPoster(slug)} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className={s.mini}><FilmPreview slug={slug} still /></span>
        )}
      </span>
    </span>
  );
}

// Final CTA: deep blue grainy panel + a filmstrip of film previews drifting past.
export default function CtaPanel({ grainId }: { grainId: string }) {
  const row = [...FILMS, ...FILMS, ...FILMS, ...FILMS];
  return (
    <section className={s.section}>
      <div className={s.panel}>
        <Grain id={grainId} />
        <span className={s.eyebrow}>Ready when you are</span>
        <h2 className={s.h2}>Put your product in motion.</h2>
        <div className={s.buttons}>
          <LightButton href="#order">Start your film</LightButton>
          <GlassButton href={`mailto:${CONTACT_EMAIL}`}>Email us</GlassButton>
        </div>
        <div className={s.stripWrap} aria-hidden="true">
          <div className={`strip ${s.strip}`}>
            {row.map((f, i) => <Tile key={i} slug={f.slug} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
