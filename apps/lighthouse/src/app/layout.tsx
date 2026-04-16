import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { BRAND_ASSETS, BRAND_NAME, BRAND_SITE_URL } from "@dba/theme/brand";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Website Audit & Performance Tool | Designed by Anthony",
  description:
    "Get a free Google Lighthouse report to see what's holding your site back. We audit speed, accessibility, and SEO.",
  openGraph: {
    title: "Website Audit & Performance Tool | Designed by Anthony",
    description:
      "Free Lighthouse audit — performance, accessibility, best practices, and SEO scores in under 60 seconds.",
    url: "https://lighthouse.designedbyanthony.com",
    siteName: BRAND_NAME,
    images: [
      {
        url: `${BRAND_SITE_URL}/images/og-site-premium.png`,
        width: 2400,
        height: 1260,
        alt: `${BRAND_NAME} — Free Lighthouse audit`,
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Audit & Performance Tool | Designed by Anthony",
    description:
      "Free Lighthouse audit — performance, accessibility, best practices, and SEO scores in under 60 seconds.",
    images: [`${BRAND_SITE_URL}/images/og-site-premium.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <header className="w-full border-b border-white/5 bg-[rgba(11,18,32,0.6)] backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
            <Link
              href={BRAND_SITE_URL}
              className="flex items-center gap-3 no-underline"
              aria-label={`${BRAND_NAME} — home`}
            >
              <Image
                src={BRAND_ASSETS.mark}
                alt=""
                width={36}
                height={27}
                className="h-7 w-auto object-contain shrink-0"
                priority
              />
              <span className="text-sm font-semibold text-white/90 tracking-tight">
                {BRAND_NAME}
              </span>
            </Link>
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
              Lighthouse Audit
            </span>
          </div>
        </header>
        {children}
        <CookieConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
