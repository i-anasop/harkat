import s from "./FilmPreview.module.css";

// In-design animated placeholder for each Pond film; shown until the real films are approved.
// Fills its parent. `still` turns off the loop animations (for tiny previews).
export default function FilmPreview({ slug, still }: { slug: string; still?: boolean }) {
  const loop = still ? "" : "loop", loop2 = still ? "" : "loop2";
  switch (slug) {
    case "pond-for-ai-agents":
      return (
        <div className={s.white} style={{ flexDirection: "column", gap: 20 }}>
          <span className={`${loop} ${s.big}`}>AI agents that <span className={s.blue}>work for you.</span></span>
          <span className={loop2} style={{ display: "flex", gap: 6 }}>
            <span className={s.chip}>Find leads</span>
            <span className={`${s.chip} ${s.chipOn}`}>Build agents</span>
            <span className={s.chip}>Automate</span>
          </span>
        </div>
      );
    case "whatsapp-booking-agent":
      return (
        <div className={`soft ${s.fill}`}>
          <div className={s.chat}>
            <span style={{ fontSize: 12, color: "#5B6275" }}>WhatsApp · Booking agent</span>
            <span className={`${loop} ${s.bubbleIn}`}>Can I book Tuesday morning?</span>
            <span className={`${loop2} ${s.bubbleOut}`}>Booked — Tue, 10:30 AM</span>
          </div>
        </div>
      );
    case "pond-bot-launch":
      return (
        <div className={s.white}>
          <div className={`${loop} ${s.notif}`}>
            <span className={s.avatar}>PB</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Pond Bot <span style={{ fontWeight: 400, color: "#5B6275" }}>replied</span></span>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "#3C4253" }}>Here are AI agent ideas for your business.</span>
            </span>
          </div>
        </div>
      );
    default:
      return (
        <div className={s.white}>
          <span className={`${loop} ${s.meet}`}>Meet <span className={s.blue}>Pond AI.</span></span>
        </div>
      );
  }
}
