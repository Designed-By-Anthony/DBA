import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const SITE_TITLE = "ANTHONY. | Digital Infrastructure Architect";
const SITE_DESCRIPTION =
  "Bespoke digital estates and high-performance infrastructure for the 315 and beyond.";

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: "%s | ANTHONY." },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}

