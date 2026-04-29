import { BRAND_NAME, BRAND_SITE_URL } from "@/design-system/brand";

const AUDIT_PATH = "/lighthouse";

export function LighthouseJsonLd() {
	const url = `${BRAND_SITE_URL}${AUDIT_PATH}`;
	const graph = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				"@id": `${BRAND_SITE_URL}/#website`,
				name: BRAND_NAME,
				url: BRAND_SITE_URL,
			},
			{
				"@type": "WebApplication",
				"@id": `${url}#webapp`,
				name: "Lighthouse Scanner — Free website audit",
				applicationCategory: "BusinessApplication",
				applicationSubCategory: "SEO & Web Performance",
				operatingSystem: "Any",
				url,
				description:
					"Free technical website audit: Google PageSpeed Insights lab scores, on-page SEO signals, crawl health (robots.txt, sitemap), optional local context, and an AI-written executive summary with prioritized fixes.",
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				},
				provider: {
					"@type": "Organization",
					name: BRAND_NAME,
					url: BRAND_SITE_URL,
				},
				featureList: [
					"PageSpeed Insights (Core Web Vitals & Lighthouse categories)",
					"On-page HTML SEO signals",
					"Robots.txt and XML sitemap checks",
					"AI-prioritized recommendations",
					"Sharable report link when storage is enabled",
				],
			},
			{
				"@type": "WebPage",
				"@id": `${url}#webpage`,
				url,
				name: `Lighthouse Scanner | ${BRAND_NAME}`,
				isPartOf: { "@id": `${BRAND_SITE_URL}/#website` },
				about: { "@id": `${url}#webapp` },
				description:
					"Run a free website audit: performance, accessibility, SEO, crawl signals, and plain-English next steps.",
			},
			{
				"@type": "BreadcrumbList",
				"@id": `${url}#breadcrumb`,
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: "Home",
						item: BRAND_SITE_URL,
					},
					{
						"@type": "ListItem",
						position: 2,
						name: "Lighthouse Scanner",
						item: url,
					},
				],
			},
			{
				"@type": "FAQPage",
				"@id": `${url}#faq`,
				mainEntity: [
					{
						"@type": "Question",
						name: "What does the Lighthouse Scanner audit include?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "It combines Google PageSpeed Insights lab data (performance, accessibility, best practices, SEO categories), a read of your homepage HTML for technical SEO signals, robots.txt and sitemap checks, optional Google Places context when configured, and an AI-generated summary with prioritized actions.",
						},
					},
					{
						"@type": "Question",
						name: "Is the audit free?",
						acceptedAnswer: {
							"@type": "Answer",
							text: "Yes. There is no credit card required. You receive a report link and optional email summary when delivery is configured on the deployment.",
						},
					},
				],
			},
		],
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: static structured data graph (no user input).
			dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
		/>
	);
}
