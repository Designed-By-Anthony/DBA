import "@/design-system/dba-global.css";
import { CrispBootstrap } from "@/components/CrispBootstrap";
import "@/styles/layout-shell.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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
	},
	twitter: {
		card: "summary_large_image",
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

export default function RootLayout({ children }: { children: ReactNode }) {
	const leadWebhookDefault =
		process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL?.trim() ?? "";
	const recaptchaSiteKey =
		process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";
	const recaptchaAction =
		process.env.NEXT_PUBLIC_RECAPTCHA_ACTION?.trim() || "contact_submit";
	return (
		<html
			lang="en"
			prefix="og: https://ogp.me/ns#"
			data-scroll-behavior="smooth"
			data-lead-webhook={leadWebhookDefault || undefined}
			data-recaptcha-site-key={recaptchaSiteKey || undefined}
			data-recaptcha-action={recaptchaSiteKey ? recaptchaAction : undefined}
		>
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
			</body>
		</html>
	);
}
