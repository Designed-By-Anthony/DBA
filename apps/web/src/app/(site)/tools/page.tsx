import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { ToolsPage } from "./ToolsPage";

export const metadata: Metadata = {
	title: "Tools — Micro SaaS Store for Web Studios",
	description:
		"A curated set of single-purpose tools for freelancers and small web agencies. Priced to grab without a procurement process. Join the waitlist for early access.",
	openGraph: {
		title: "Tools — Micro SaaS Store | Designed by Anthony",
		description:
			"Single-purpose tools for web studios. No subscriptions, no bloat. Founding-rate pricing for waitlist members.",
		url: "https://designedbyanthony.com/tools",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Tools — Micro SaaS Store | Designed by Anthony",
		description:
			"Single-purpose tools for web studios. No subscriptions, no bloat. Founding-rate pricing for waitlist members.",
	},
	alternates: { canonical: "/tools" },
};

export default function Tools() {
	return (
		<MarketingChrome>
			<ToolsPage />
		</MarketingChrome>
	);
}
