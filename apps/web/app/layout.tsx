import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import OrderModal from "@/components/OrderModal";
import FilmPlayer from "@/components/FilmPlayer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400"] });

const DESCRIPTION = "Agency-quality product films with your real UI and crafted sound — delivered in days, not months.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Harkat — Motion films for AI & SaaS", template: "Harkat — %s" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Harkat",
    title: "Harkat — Motion films for AI & SaaS",
    description: DESCRIPTION,
    images: [{ url: "/assets/harkat-hero-poster.jpg", width: 1920, height: 1080 }],
  },
  twitter: { card: "summary_large_image", site: "@harkatai", images: ["/assets/harkat-hero-poster.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#F6F7F9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <div className="page">
          <div className="wrap">{children}</div>
        </div>
        <OrderModal />
        <FilmPlayer />
      </body>
    </html>
  );
}
