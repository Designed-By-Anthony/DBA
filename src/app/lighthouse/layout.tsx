import { CookieConsentBanner } from "@lh/components/CookieConsentBanner";
import { LighthouseJsonLd } from "@lh/components/LighthouseJsonLd";
import { LighthouseTechFingerprints } from "@lh/components/LighthouseTechFingerprints";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
	BRAND_MARK_IMAGE,
	BRAND_NAME,
	BRAND_SITE_URL,
} from "@/design-system/brand";
import "./lighthouse-globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
});

const LIGHTHOUSE_PATH = "/lighthouse";
const LIGHTHOUSE_URL = `${BRAND_SITE_URL}${LIGHTHOUSE_PATH}`;

/** Segment overrides root viewport: safe areas + keyboard-friendly mobile forms. */
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
	metadataBase: new URL(BRAND_SITE_URL),
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
	alternates: {
		canonical: LIGHTHOUSE_URL,
	},
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
		title:
			"Lighthouse Scanner — Free SEO & Performance Audit | Designed by Anthony",
		description:
			"PageSpeed + on-page SEO + crawl checks + AI summary. See lighthouse2.md for full feature map.",
		images: [`${BRAND_SITE_URL}/images/og-site-premium.png`],
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Lighthouse Scanner",
	},
};

export default function LighthouseLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div
			className={`lighthouse-segment relative ${inter.variable} ${outfit.variable} font-sans antialiased`}
		>
			<LighthouseJsonLd />
			<LighthouseTechFingerprints />
			<header className="lighthouse-header w-full border-b border-white/[0.06] bg-[rgba(6,10,18,0.72)] backdrop-blur-xl">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
					<Link
						href={BRAND_SITE_URL}
						className="flex items-center gap-3 no-underline"
						aria-label={`${BRAND_NAME} — home`}
					>
						<Image
							src={BRAND_MARK_IMAGE}
							alt=""
							width={BRAND_MARK_IMAGE.width}
							height={BRAND_MARK_IMAGE.height}
							className="h-7 w-auto shrink-0 object-contain"
							priority
						/>
						<span className="text-sm font-semibold tracking-tight text-white/90">
							{BRAND_NAME}
						</span>
					</Link>
					<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
						Lighthouse Audit
					</span>
				</div>
			</header>
			{children}
			<CookieConsentBanner />
		</div>
	);
}
