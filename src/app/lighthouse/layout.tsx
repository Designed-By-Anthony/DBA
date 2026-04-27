import { CookieConsentBanner } from "@lh/components/CookieConsentBanner";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import {
	BRAND_ASSETS,
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

export const metadata: Metadata = {
	title:
		"Lighthouse Scanner — Free SEO & Performance Audit | Designed by Anthony",
	description:
		"Free website audit: PageSpeed Insights (Core Web Vitals + Lighthouse scores), on-page SEO signals, robots.txt and sitemap checks, optional local context, AI prioritized fixes. For service businesses — Built by Anthony, Central NY.",
	openGraph: {
		title:
			"Lighthouse Scanner — Free SEO & Performance Audit | Designed by Anthony",
		description:
			"PageSpeed lab data, technical SEO signals, crawl snapshot, and plain-English next steps. No credit card.",
		url: `${BRAND_SITE_URL}/lighthouse`,
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
};

export default function LighthouseLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div
			className={`lighthouse-segment ${inter.variable} ${outfit.variable} font-sans antialiased`}
		>
			<Script
				id="trusted-types-bootstrap-lh"
				src="/trusted-types-bootstrap.js"
				strategy="beforeInteractive"
			/>
			<Script
				id="cf-turnstile-api"
				src="https://challenges.cloudflare.com/turnstile/v0/api.js"
				strategy="afterInteractive"
				async
				defer
			/>
			<header className="w-full border-b border-white/5 bg-[rgba(11,18,32,0.6)] backdrop-blur-md">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
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
