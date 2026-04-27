import Script from "next/script";
import "@/design-system/dba-global.css";
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
				<Script
					id="crisp-widget"
					strategy="afterInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: vendor bootstrap snippet (static)
					dangerouslySetInnerHTML={{
						__html: `(function () {
  if (window.__dbaCrispLoaded) return;
  window.__dbaCrispLoaded = true;
  window.$crisp = window.$crisp || [];
  window.CRISP_RUNTIME_CONFIG = Object.assign({}, window.CRISP_RUNTIME_CONFIG, {
    locale: "en",
  });
  window.CRISP_WEBSITE_ID = "427bf1d5-f2a9-408b-8cc6-0efc6489c676";
  var d = document;
  var s = d.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = 1;
  d.getElementsByTagName("head")[0].appendChild(s);
})();`,
					}}
				/>
			</body>
		</html>
	);
}
