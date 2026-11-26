import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import OrderModal from "@/components/OrderModal";
import FilmPlayer from "@/components/FilmPlayer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400"] });

const TITLE = "Harkat — AI launch films for startups";
const DESCRIPTION = "Describe a product. Harkat cuts a sample 2D launch film in the browser — sound effects only, never music. A person finishes the film you hire.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "Harkat — %s" },
  description: DESCRIPTION,
  applicationName: "Harkat",
  authors: [{ name: "Harkat" }],
  icons: {
    icon: [{ url: "/assets/harkat-mark.svg", type: "image/svg+xml" }],
    apple: "/assets/harkat-mark.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Harkat",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/assets/harkat-hero-poster.jpg", width: 1920, height: 1080, alt: "Harkat launch film" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@harkatai",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/harkat-hero-poster.jpg"],
  },
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
