import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import DocsNav from "./DocsNav";
import { PrevNext } from "./parts";
import s from "./docs.module.css";

export const metadata: Metadata = { title: { default: "Docs", template: "Harkat Docs — %s" } };

// Docs hub: everything about how Harkat works, our principles, the legal bits and case studies.
// Ready to move to its own subdomain (e.g. docs.<domain>) later with a single rewrite.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav current="/docs" />
      <div className={s.shell}>
        <DocsNav />
        <main className={s.main}>{children}<PrevNext /></main>
      </div>
      <Footer />
    </>
  );
}
