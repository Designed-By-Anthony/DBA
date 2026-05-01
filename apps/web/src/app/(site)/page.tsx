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
	buildVaultCrmSoftwareApplicationSchema,
	type SchemaValue,
} from "@/lib/seo";

const HOME_TITLE = "ANTHONY. | Digital Infrastructure Architect";
const HOME_DESCRIPTION =
	"Bespoke digital estates and high-performance infrastructure for the 315 and beyond.";

export const revalidate = 86400;

const HOME_OG_IMAGE = {
	url: "/images/og-site-premium.png",
	width: 2400,
	height: 1260,
	alt: "ANTHONY. — Digital infrastructure architect",
	type: "image/png",
} as const;

export const metadata: Metadata = {
	title: { absolute: HOME_TITLE },
	description: HOME_DESCRIPTION,
	openGraph: {
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
		url: "https://designedbyanthony.com",
		type: "website",
		images: [HOME_OG_IMAGE],
	},
	twitter: {
		card: "summary_large_image",
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
		images: [HOME_OG_IMAGE.url],
	},
	alternates: { canonical: "/" },
};

const homeServiceSchema = buildItemListSchema({
	name: "Core Services",
	description:
		"ANTHONY. provides custom websites, local SEO, managed hosting, and website rescue for service businesses.",
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
	buildVaultCrmSoftwareApplicationSchema(),
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
			{/* SEO Structured Data — native <script type="application/ld+json"> renders
                in the initial HTML stream from this Server Component, where Google's
                rich-results parser expects it. (next/script would inject post-hydrate
                in <body>, which works but is non-canonical for JSON-LD.) */}
			{structuredData.map((entry) => (
				<script
					key={jsonLdScriptKey(entry)}
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is data, not executable
					dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
				/>
			))}

			<MarketingChrome footerCta={homeFooterCta}>
				<HomePage />
			</MarketingChrome>
		</>
	);
}
