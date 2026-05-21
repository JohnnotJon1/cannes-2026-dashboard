import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";

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

// Falls back to the canonical private URL when NEXT_PUBLIC_SITE_URL
// is unset. Each Vercel project sets its own value so OG meta resolves
// correctly per deployment.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://cannes-2026-dashboard.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Cannes Lions 2026 · 1,658 going",
    template: "%s · Cannes Lions 2026",
  },
  description:
    "See who's going + 200 events to register for in one place.",
  keywords: [
    "Cannes Lions 2026",
    "Cannes advertising festival",
    "Cannes beach clubs",
    "Cannes parties",
    "Cannes networking",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Cannes Lions 2026 · 1,658 going",
    description: "See who's going + 200 events to register for in one place.",
    type: "website",
    url: siteUrl,
    siteName: "Cannes Lions 2026 dashboard",
    images: [
      {
        url: "/og-cannes.jpg",
        width: 1200,
        height: 630,
        alt: "La Croisette at blue hour, Cannes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cannes Lions 2026 · 1,658 going",
    description: "See who's going + 200 events to register for in one place.",
    images: ["/og-cannes.jpg"],
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <OnboardingOverlay />
      </body>
    </html>
  );
}
