import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
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
  description: "Get a free Google Lighthouse report to see what's holding your site back. We audit speed, accessibility, and SEO.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
