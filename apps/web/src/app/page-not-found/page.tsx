import "@/app/home-page.css";
import "@/app/marketing-site-pages.css";
import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/MarketingSitePages";

export const metadata: Metadata = {
	title: "Page not found",
	description:
		"The page you requested is not on designedbyanthony.com. Use the homepage, services, or contact link to continue.",
	robots: { index: false, follow: true },
	alternates: { canonical: "/page-not-found" },
	openGraph: {
		title: "Page not found | ANTHONY.",
		description:
			"The page you requested is not on designedbyanthony.com. Use the homepage or contact link to continue.",
		url: "https://designedbyanthony.com/page-not-found",
		siteName: "ANTHONY.",
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "Page not found | ANTHONY.",
		description:
			"The page you requested is not on designedbyanthony.com. Use the homepage or contact link to continue.",
	},
};

/** Served when middleware rewrites `/404` → `/page-not-found` (Next reserves `404` on catch-all). */
export default function PageNotFoundMarketing() {
	return <StaticMarketingPage slug="404" />;
}
