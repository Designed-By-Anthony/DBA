import "@/design-system/dba-global.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Outfit } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { CrispBootstrap } from "@/components/CrispBootstrap";
import { JsonLd } from "@/components/JsonLd";

/**
 * Load Outfit Variable via Next.js Font API so the --font-outfit CSS variable
 * is available globally. theme.css sets --font-display to "Outfit Variable",
 * but without the Next.js font loader the Google Font only loads on the
 * Lighthouse segment (which has its own Outfit import). Loading it here
 * ensures headings use Outfit everywhere on the marketing site.
 */
const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
	display: "swap",
});

/**
 * Load Fraunces Variable via Next.js Font API so --font-fraunces is set on
 * <html>. Decorative serif headings may reference var(--font-fraunces).
 */
const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	axes: ["opsz", "SOFT", "WONK"],
	display: "swap",
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

/** Mobile-first: correct scaling on phones/tablets; safe areas for notched devices. */
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
	themeColor: [
		{ media: "(prefers-color-scheme: dark)", color: "#0f1218" },
		{ media: "(prefers-color-scheme: light)", color: "#0f1218" },
	],
	colorScheme: "dark",
};

const SITE_TITLE = "ANTHONY. | Digital Infrastructure Architect";
const SITE_DESCRIPTION =
	"Bespoke digital estates and high-performance infrastructure for the Mohawk Valley (315), Capital Region (518), and Central New York — engineered in Rome, NY.";

export const metadata: Metadata = {
	metadataBase: new URL("https://designedbyanthony.com"),
	title: {
		default: SITE_TITLE,
		template: "%s | ANTHONY.",
	},
	description: SITE_DESCRIPTION,
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: SITE_TITLE,
	},
	formatDetection: {
		telephone: false,
		email: false,
		address: false,
	},
	generator: "Next.js",
	authors: [{ name: "Anthony Jones — ANTHONY." }],
	other: {
		"business-type": "B2B",
		industry: "Professional Services / Web Design & Local SEO",
	},
	openGraph: {
		siteName: "ANTHONY.",
		type: "website",
		locale: "en_US",
		url: "https://designedbyanthony.com",
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		images: [
			{
				url: "/images/og-site-premium.png",
				width: 2400,
				height: 1260,
				alt: "ANTHONY. — Mohawk Valley digital infrastructure",
				type: "image/png",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		images: ["/images/og-site-premium.png"],
	},
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon.png", sizes: "16x16", type: "image/png" },
		],
		shortcut: "/favicon.ico",
		apple: "/apple-touch-icon-180.png",
	},
};

const DEFAULT_LEAD_WEBHOOK =
	"https://tremendous-emu-522.convex.site/webhook/lead";

export default function RootLayout({ children }: { children: ReactNode }) {
	const leadWebhookDefault =
		process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL?.trim() || DEFAULT_LEAD_WEBHOOK;
	return (
		<html
			lang="en"
			prefix="og: https://ogp.me/ns#"
			data-scroll-behavior="smooth"
			data-lead-webhook={leadWebhookDefault || undefined}
			className={`${outfit.variable} ${fraunces.variable} ${inter.variable}`}
		>
			<head>
				<JsonLd />
			</head>
			<body>
				{/* Google Tag Manager (noscript) */}
				<noscript>
					<iframe
						src="https://www.googletagmanager.com/ns.html?id=GTM-W2JBTH5L"
						height="0"
						width="0"
						style={{ display: "none", visibility: "hidden" }}
						title="GTM-NoScript"
					/>
				</noscript>
				{children}
				<CrispBootstrap />
				{/* Stripe v3 — loaded eagerly so Wappalyzer/BuiltWith detect "Payment Processing" */}
				<Script
					src="https://js.stripe.com/v3/"
					strategy="afterInteractive"
					id="stripe-js"
				/>
			</body>
		</html>
	);
}
