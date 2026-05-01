import "@/design-system/dba-global.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { CrispBootstrap } from "@/components/CrispBootstrap";
import { JsonLd } from "@/components/JsonLd";
import { FirstVisitSplash } from "@/components/marketing/FirstVisitSplash";

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
 * <html>. BrandHeader and BrandFooter reference var(--font-fraunces) for the
 * brand wordmark. Without this, the variable is unset on marketing pages and
 * the browser falls back to the @font-face "Fraunces Variable" name — which
 * works but skips preloading optimisations.
 */
const fraunces = Fraunces({
	variable: "--font-fraunces",
	subsets: ["latin"],
	axes: ["opsz", "SOFT", "WONK"],
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

export const metadata: Metadata = {
	metadataBase: new URL("https://designedbyanthony.com"),
	title: {
		default: "Designed by Anthony",
		template: "%s | Designed by Anthony",
	},
	description:
		"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York.",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Designed by Anthony",
	},
	formatDetection: {
		telephone: false,
		email: false,
		address: false,
	},
	openGraph: {
		siteName: "Designed by Anthony",
		type: "website",
		locale: "en_US",
		url: "https://designedbyanthony.com",
		title: "Designed by Anthony — Custom websites & local SEO",
		description:
			"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York. Lighthouse-grade performance, Bronze finish.",
		images: [
			{
				url: "/images/og-site-premium.png",
				width: 2400,
				height: 1260,
				alt: "Designed by Anthony — Mohawk Valley web design & local SEO",
				type: "image/png",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Designed by Anthony — Custom websites & local SEO",
		description:
			"Custom web design and local SEO for service businesses in the Mohawk Valley and Central New York.",
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
			className={`${outfit.variable} ${fraunces.variable}`}
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
				{/* Global first-visit splash. Mounted in the root layout so
				    it fires on the user's very first landing regardless of
				    entry URL. Reads `window.location` directly — no
				    `useSearchParams` / Suspense boundary required. */}
				<FirstVisitSplash />
				<CrispBootstrap />
			</body>
		</html>
	);
}
