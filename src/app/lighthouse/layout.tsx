import { CookieConsentBanner } from "@lh/components/CookieConsentBanner";
import { LighthouseJsonLd } from "@lh/components/LighthouseJsonLd";
import { LighthouseTechFingerprints } from "@lh/components/LighthouseTechFingerprints";
import { RECAPTCHA_ENTERPRISE_SITE_KEY } from "@lh/lib/recaptchaEnterpriseConfig";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Outfit } from "next/font/google";
import Script from "next/script";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { absoluteSiteUrl, SITE_BRAND } from "@/design-system/site-config";
import "./lighthouse-globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	axes: ["opsz", "SOFT", "WONK"],
});

const LIGHTHOUSE_PATH = "/lighthouse";
const LIGHTHOUSE_URL = absoluteSiteUrl(LIGHTHOUSE_PATH);

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
	themeColor: [
		{ media: "(prefers-color-scheme: dark)", color: "#060a12" },
		{ media: "(prefers-color-scheme: light)", color: "#0f172a" },
	],
	colorScheme: "dark",
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_BRAND.url),
	title:
		"Lighthouse Scanner — Free SEO & Performance Audit | Designed by Anthony",
	description:
		"Free website audit: PageSpeed Insights (Core Web Vitals + Lighthouse scores), on-page SEO signals, robots.txt and sitemap checks, optional local context, AI prioritized fixes. For service businesses — Built by Anthony, Central NY.",
	keywords: [
		"free website audit",
		"SEO audit tool",
		"PageSpeed Insights",
		"Core Web Vitals",
		"Lighthouse audit",
		"technical SEO",
		"local business website",
		"Designed by Anthony",
	],
	alternates: { canonical: LIGHTHOUSE_URL },
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	category: "technology",
	openGraph: {
		title:
			"Lighthouse Scanner — Free SEO & Performance Audit | Designed by Anthony",
		description:
			"PageSpeed lab data, technical SEO signals, crawl snapshot, and plain-English next steps. No credit card.",
		url: LIGHTHOUSE_URL,
		siteName: SITE_BRAND.name,
		images: [
			{
				url: absoluteSiteUrl("/images/og-site-premium.png"),
				width: 2400,
				height: 1260,
				alt: `${SITE_BRAND.name} — Free Lighthouse audit`,
				type: "image/png",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title:
			"Lighthouse Scanner — Free SEO & Performance Audit | Designed by Anthony",
		description:
			"PageSpeed + on-page SEO + crawl checks + AI summary. See lighthouse2.md for full feature map.",
		images: [absoluteSiteUrl("/images/og-site-premium.png")],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Lighthouse Scanner",
	},
};

export default function LighthouseLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div
			className={`lighthouse-segment relative ${inter.variable} ${outfit.variable} ${fraunces.variable} font-sans antialiased`}
		>
			<LighthouseJsonLd />
			<LighthouseTechFingerprints />
			<Script
				id="recaptcha-enterprise"
				src={`https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(RECAPTCHA_ENTERPRISE_SITE_KEY)}`}
				strategy="afterInteractive"
			/>

			<BrandHeader currentSection="audit" includeHamburger={false} />

			{children}

			<BrandFooter buildTag="Lighthouse Scanner v2" />

			<CookieConsentBanner />
		</div>
	);
}
