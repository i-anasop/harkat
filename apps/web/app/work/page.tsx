import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaPanel from "@/components/CtaPanel";
import WorkGrid from "./WorkGrid";

export const metadata: Metadata = { title: "Work" };

export default function Work() {
  return (
    <>
      <Nav current="/work" />
      <section className="phead">
        <span className="r1 phead-label">Work</span>
        <h1 className="r1">Selected films.<br /><span className="muted-h">Real launches.</span></h1>
        <p className="r2">Every film below shipped for a real product — built in code, frame by frame.</p>
      </section>
      <WorkGrid />
      <CtaPanel grainId="gw" />
      <Footer />
    </>
  );
}
