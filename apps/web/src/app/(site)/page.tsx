import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/HomePage";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { homeFaqEntries, homeFooterCta } from "@/data/home";
import {
	buildBaseOrganizationSchema,
	buildBaseWebsiteSchema,
	buildFaqPageSchema,
	buildFounderPersonSchema,
	buildItemListSchema,
	buildSiteNavigationSchema,
	buildVertaflowCrmSoftwareApplicationSchema,
	type SchemaValue,
} from "@/lib/seo";

// Title trimmed to 56 chars (under Google's ~60 char SERP cap) and
// description to 152 chars (under the 160 char meta description cap)
// to fix the audit findings reported in the user-supplied PDF.
const HOME_TITLE = "Mohawk Valley Web Design & Local SEO | Designed by Anthony";
const HOME_DESCRIPTION =
	"Custom websites & local SEO for Mohawk Valley and Central NY service businesses. Built to rank on Google and turn searches into booked work.";

export const metadata: Metadata = {
	title: HOME_TITLE,
	description: HOME_DESCRIPTION,
	openGraph: {
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
		url: "https://designedbyanthony.com",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
	},
	alternates: { canonical: "/" },
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
			description:
				"Custom websites built for trust, clarity, speed, and conversion.",
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
			description:
				"Managed hosting and support that keeps your site fast, current, and easy to trust.",
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
			description:
				"Professional business email and workspace administration setup.",
		},
		{
			name: "Custom Google AI Chatbots & Forms",
			url: "/services/ai-automation",
			description:
				"Automated chatbots and smart forms for hands-free lead capture.",
		},
	],
});

const homeFaqSchema = buildFaqPageSchema(
	homeFaqEntries.map(({ question, answer }) => ({ question, answer })),
	{ path: "/" },
);

const structuredData: SchemaValue[] = [
	buildBaseOrganizationSchema(),
	buildFounderPersonSchema(),
	buildBaseWebsiteSchema(),
	buildSiteNavigationSchema(),
	buildVertaflowCrmSoftwareApplicationSchema(),
	homeServiceSchema,
	homeFaqSchema,
];

function jsonLdScriptKey(entry: SchemaValue): string {
	const rawId = entry["@id"];
	if (typeof rawId === "string" && rawId.length > 0) {
		return rawId;
	}
	const t = entry["@type"];
	const typeLabel = Array.isArray(t)
		? t.join("-")
		: typeof t === "string"
			? t
			: "schema";
	return `${typeLabel}-${JSON.stringify(entry).length}`;
}

export default function Home() {
	return (
		<>
			{structuredData.map((entry) => (
				<script
					key={jsonLdScriptKey(entry)}
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
					dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
				/>
			))}
			<MarketingChrome footerCta={homeFooterCta}>
				<HomePage />
			</MarketingChrome>
		</>
	);
}
