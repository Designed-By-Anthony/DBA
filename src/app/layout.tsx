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
	manifest: "/site.webmanifest",
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
		icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
		apple: "/apple-touch-icon-180.png",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" prefix="og: https://ogp.me/ns#">
			<body>
				{children}
				<CrispBootstrap />
			</body>
		</html>
	);
}
