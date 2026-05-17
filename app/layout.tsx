import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PrivacyBanner } from "@/components/privacy-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const siteUrl = "https://cannes-command-center.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Cannes Command Center — Your Cannes Lions 2026 dashboard",
    template: "%s — Cannes Command Center",
  },
  description:
    "A privacy-first dashboard for Cannes Lions 2026: discover beach clubs, parties, panels and yacht dinners — track which ones you're registered for, and see who's going. Built for first-timers and veterans.",
  keywords: [
    "Cannes Lions 2026",
    "Cannes advertising festival",
    "Cannes beach clubs",
    "Cannes parties",
    "Cannes networking",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Cannes Command Center — Your Cannes Lions 2026 dashboard",
    description:
      "Discover events, track registrations, see who's going. Privacy-first — your data never leaves your browser.",
    type: "website",
    url: siteUrl,
    siteName: "Cannes Command Center",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cannes Command Center",
    description:
      "Your privacy-first Cannes Lions 2026 dashboard. Events, status tracking, who's going.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d3d3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sand-50 text-[color:var(--ink)]">
        <PrivacyBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
