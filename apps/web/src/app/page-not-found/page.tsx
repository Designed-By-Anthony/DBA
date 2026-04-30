import "@/app/home-page.css";
import "@/app/marketing-site-pages.css";
import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { StaticMarketingPage } from "@/components/marketing/MarketingSitePages";
import { homeFooterCta } from "@/data/home";

export const metadata: Metadata = {
	title: "Page not found",
	description:
		"The page you requested is not on designedbyanthony.com. Use the homepage, services, or contact link to continue.",
	robots: { index: false, follow: true },
	alternates: { canonical: "/page-not-found" },
	openGraph: {
		title: "Page not found | Designed by Anthony",
		description:
			"The page you requested is not on designedbyanthony.com. Use the homepage or contact link to continue.",
		url: "https://designedbyanthony.com/page-not-found",
		siteName: "Designed by Anthony",
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "Page not found | Designed by Anthony",
		description:
			"The page you requested is not on designedbyanthony.com. Use the homepage or contact link to continue.",
	},
};

/** Served when middleware rewrites `/404` → `/page-not-found` (Next reserves `404` on catch-all). */
export default function PageNotFoundMarketing() {
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<StaticMarketingPage slug="404" />
		</MarketingChrome>
	);
}
