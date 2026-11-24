import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Studio from "./Studio";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <>
      <Nav current="/studio" />
      <section className="phead">
        <span className="r1 phead-label">Studio</span>
        <h1 className="r1">Preview a film<br /><span className="muted-h">from a brief.</span></h1>
        <p className="r2">Name, one-liner, a URL, a few features. Harkat cuts a sample you can watch here, then you order the finished film the usual way.</p>
      </section>
      <Studio />
      <Footer />
    </>
  );
}
