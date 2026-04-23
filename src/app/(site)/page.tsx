import { HomePage } from "@/components/marketing/HomePage";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { homeFaqEntries, homeFooterCta } from "@/data/home";
import {
	buildAgencyOsSoftwareApplicationSchema,
	buildBaseOrganizationSchema,
	buildBaseWebsiteSchema,
	buildFaqPageSchema,
	buildFounderPersonSchema,
	buildItemListSchema,
	buildLighthouseSoftwareApplicationSchema,
} from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title:
		"Mohawk Valley Web Design for Service Businesses — Utica, Rome, Syracuse | Designed by Anthony",
	description:
		"Custom web design for Mohawk Valley and Central NY service businesses. Fast, friendly websites built to rank on Google and turn visitors into booked work — so more of the people searching for your service actually call. Free 60-second website audit, report emailed instantly.",
	openGraph: {
		title:
			"Mohawk Valley Web Design for Service Businesses — Utica, Rome, Syracuse | Designed by Anthony",
		description:
			"Custom web design for Mohawk Valley and Central NY service businesses. Fast, friendly websites built to rank on Google and turn visitors into booked work.",
		url: "https://designedbyanthony.com",
		type: "website",
	},
};

const homeServiceSchema = buildItemListSchema({
	name: "Core Services",
	description:
		"Designed by Anthony provides custom websites, local SEO, managed hosting, and website rescue for service businesses, including a limited 10-client launch pilot.",
	path: "/",
	items: [
		{
			name: "Custom Web Design",
			url: "/services/custom-web-design",
			description: "Custom websites built for trust, clarity, speed, and conversion.",
		},
		{
			name: "Local SEO and Search Visibility",
			url: "/services/local-seo",
			description:
				"Technical and on-page SEO that helps service businesses show up more clearly in local search.",
		},
		{
			name: "Managed Hosting and VIP Support",
			url: "/services/managed-hosting",
			description: "Managed hosting and support that keeps your site fast, current, and easy to trust.",
		},
		{
			name: "Website Rescues and Mobile Optimization",
			url: "/services/website-rescue",
			description:
				"Website rebuilds for older sites that need better mobile usability and stronger conversion flow.",
		},
		{
			name: "Google Workspace Setup",
			url: "/services/workspace-setup",
			description: "Professional business email and workspace administration setup.",
		},
		{
			name: "Custom Google AI Chatbots & Forms",
			url: "/services/ai-automation",
			description: "Automated chatbots and smart forms for hands-free lead capture.",
		},
	],
});

const homeFaqSchema = buildFaqPageSchema(
	homeFaqEntries.map(({ question, answer }) => ({ question, answer })),
);

const structuredData = [
	buildBaseOrganizationSchema(),
	buildFounderPersonSchema(),
	buildBaseWebsiteSchema(),
	buildAgencyOsSoftwareApplicationSchema(),
	homeServiceSchema,
	buildLighthouseSoftwareApplicationSchema(),
	homeFaqSchema,
];

export default function Home() {
	return (
		<>
			{structuredData.map((entry, index) => (
				<script
					key={`home-ld-${index}`}
					type="application/ld+json"
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
				/>
			))}
			<MarketingChrome footerCta={homeFooterCta}>
				<HomePage />
			</MarketingChrome>
		</>
	);
}
