import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/editorial/SiteHeader";
import { SiteFooter } from "@/components/editorial/SiteFooter";
import { SITE_URL } from "@/lib/site";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// When replacing the OG image, rename the file (e.g. /og-v2.png) and update
// this path — scraper caches key on the URL, so a new name busts them reliably.
const OG_IMAGE = "/og.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "A Drop of Seoul",
  description:
    "A curated guide to Korean beauty, hair rituals, head spas, and places worth knowing.",
  openGraph: {
    title: "A Drop of Seoul",
    description:
      "A curated guide to Korean beauty, hair rituals, head spas, and places worth knowing.",
    url: "/",
    siteName: "A Drop of Seoul",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "A Drop of Seoul",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A Drop of Seoul",
    description:
      "A curated guide to Korean beauty, hair rituals, head spas, and places worth knowing.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <SiteHeader />
        <div className="min-h-screen">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
