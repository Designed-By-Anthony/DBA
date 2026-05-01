/**
 * Local / regional landing pages under `/service-areas/[slug]`.
 * Keep slugs URL-safe and stable; copy should match what we actually serve.
 */
export type ServiceAreaTag = "primary" | "secondary";

export interface ServiceAreaLocation {
	slug: string;
	name: string;
	tag: ServiceAreaTag;
	/** Override label shown on the index card badge (e.g. "LOCAL", "CAPITAL REGION"). Falls back to tag-derived label when omitted. */
	cardBadge?: string;
	/** One line for index cards */
	cardTeaser: string;
	/** H1-adjacent hero line */
	heroSubtitle: string;
	metaDescription: string;
	intro: string[];
	sections: Array<{
		heading: string;
		paragraphs: string[];
	}>;
}

export const serviceAreaLocations: readonly ServiceAreaLocation[] = [
	{
		slug: "rome-ny",
		name: "Rome, NY",
		tag: "primary",
		cardTeaser: "Studio home base — same-day meetings available.",
		heroSubtitle:
			"Custom web design, local SEO, and managed hosting for Rome and the immediate Mohawk Valley.",
		metaDescription:
			"Rome, NY web design for contractors, home services, and local brands — fast mobile sites, Google-friendly structure, and local SEO from a Rome-based studio.",
		intro: [
			"Rome is our home base: when you hire ANTHONY., you are working with a builder who lives and works in the same market you serve. That matters for local nuance — how people search for plumbers, HVAC, medspas, and professional services across Oneida County — and for timelines when you want to meet in person.",
			"We ship lean, hand-coded marketing sites that load quickly on phones, read clearly to Google, and turn visitors into calls and form fills. Every project includes technical SEO structure, schema where it helps, and honest guidance on what is worth fixing first.",
		],
		sections: [
			{
				heading: "Why Rome businesses invest in a proper website",
				paragraphs: [
					"Most of your prospects still check you online before they call — even when they were referred. If the site is slow, confusing, or looks like a generic template, you lose trust before the conversation starts.",
					"We focus on clarity: who you serve, what you offer, proof (reviews, projects, certifications), and a single obvious next step on every page. Pair that with real performance tuning and you are not fighting your own site in the Map Pack and organic results.",
				],
			},
			{
				heading: "Local SEO that matches how Rome customers search",
				paragraphs: [
					"Local visibility is not only your Google Business Profile — your website has to reinforce the same services, cities, and categories in clean headings, internal links, and structured data.",
					"We align on-page content with the way people actually search in Rome, Utica, and nearby towns, without spamming city names. For multi-service trades, we structure pages so each service line can rank on its own intent.",
				],
			},
			{
				heading: "What happens when you reach out",
				paragraphs: [
					"You can request a free audit through the contact page: we review speed, accessibility, best practices, and SEO, then reply with a practical summary. If a rebuild makes sense, you get scope and pricing in writing before work starts — including the option of three payments at launch with hosting and core SEO bundled for the first three months.",
				],
			},
		],
	},
	{
		slug: "utica-ny",
		name: "Utica, NY",
		tag: "primary",
		cardTeaser:
			"Ten minutes east — regular coverage for the greater Utica area.",
		heroSubtitle:
			"Web design and local SEO for Utica contractors, home services, wellness brands, and professional firms.",
		metaDescription:
			"Utica, NY web design and local SEO for service businesses — fast custom sites, clear service pages, and Google-friendly structure from a Mohawk Valley studio.",
		intro: [
			"Utica is a core market for us — close enough for on-site conversations when it helps, and familiar enough that we already know how competitive home services, health and wellness, and professional services are in the valley.",
			"We build sites that load fast on phones, explain your offers without jargon, and support the local SEO work you need to show up when someone searches for what you do plus Utica or the surrounding towns.",
		],
		sections: [
			{
				heading: "Utica customers expect speed and credibility",
				paragraphs: [
					"Whether they find you on Google Maps or through a referral, the first click is almost always on mobile. If your hero is slow, your phone number is buried, or your service list reads like a wall of text, you lose the job to a competitor with a cleaner page.",
					"Our builds prioritize Core Web Vitals habits, readable typography, and trust signals — licenses, insurance, reviews, project photos — so the page earns the call.",
				],
			},
			{
				heading: "Service-area and multi-location structure",
				paragraphs: [
					"If you serve Utica plus several towns, we plan URL structure and internal linking so each market has a clear landing path without duplicate boilerplate. For true multi-location operators, we scope distinct location pages with unique proof and FAQs where it matters.",
				],
			},
			{
				heading: "Next step",
				paragraphs: [
					"Use the contact page to send your URL and goals. We will reply within one business day with audit findings or a suggested path — rebuild, rescue, or smaller targeted improvements.",
				],
			},
		],
	},
	{
		slug: "new-hartford-ny",
		name: "New Hartford, NY",
		tag: "primary",
		cardTeaser:
			"Adjacent to Utica — retail, wellness, and professional services.",
		heroSubtitle:
			"Polished websites for New Hartford retail, medspa, salon, and professional practices.",
		metaDescription:
			"New Hartford, NY web design for wellness, retail, and professional services — editorial layouts, booking flows, and local SEO tuned to the Utica–New Hartford corridor.",
		intro: [
			"New Hartford sits right against Utica with its own retail and wellness corridor — customers often decide between businesses based on how credible the website feels on a phone in the parking lot.",
			"We design editorial-style layouts for medspas, salons, and boutique brands, and cleaner service-first layouts for professional firms — always with performance and SEO baked in, not bolted on later.",
		],
		sections: [
			{
				heading: "Wellness and retail need a premium first impression",
				paragraphs: [
					"Your site should feel as intentional as your physical space: typography, spacing, photography treatment, and a booking or contact path that matches how you actually schedule clients.",
					"We avoid cluttered theme homepages and instead structure content so services, providers, and policies are easy to find — which also helps Google understand what you offer.",
				],
			},
			{
				heading: "Local search across New Hartford and Utica",
				paragraphs: [
					"Many searches blend Utica and New Hartford intent. We help you map content to the phrases people use, tie pages to your Google Business Profile categories, and keep NAP-style information consistent everywhere it appears.",
				],
			},
			{
				heading: "Work with us",
				paragraphs: [
					"Reach out through the contact page for a free audit or a short intro call. We will confirm fit, timeline, and pricing before any build starts.",
				],
			},
		],
	},
	{
		slug: "clinton-ny",
		name: "Clinton, NY",
		tag: "primary",
		cardTeaser: "College-town retail and professional practices.",
		heroSubtitle:
			"Websites for Clinton, NY small businesses — clear messaging, fast pages, and local SEO.",
		metaDescription:
			"Clinton, NY web design for local shops and professional practices — custom sites, speed tuning, and local SEO aligned with Hamilton College area search patterns.",
		intro: [
			"Clinton blends a tight village retail scene with professional services that draw from Hamilton College traffic and the broader Oriskany Valley. Your site needs to speak to both locals and newcomers who discover you online first.",
			"We keep messaging direct: what you offer, where you are, hours, and how to book or buy — backed by performance-focused implementation so Google and visitors both get a crisp experience.",
		],
		sections: [
			{
				heading: "Standing out in a small-town market",
				paragraphs: [
					"In a village market, word of mouth still drives a lot — but the website validates the referral. We make sure your story, services, and proof points read well on mobile and load without the lag that sends people back to the search results.",
				],
			},
			{
				heading: "SEO without gimmicks",
				paragraphs: [
					"We use clean IA, descriptive headings, and structured data where appropriate — not keyword stuffing. The goal is to help Google and humans understand the same truth about your business.",
				],
			},
			{
				heading: "Get started",
				paragraphs: [
					"Contact us from the site with your URL; we will send a straight audit summary or propose a scoped rebuild depending on what we find.",
				],
			},
		],
	},
	{
		slug: "syracuse-ny",
		name: "Syracuse, NY",
		tag: "primary",
		cardTeaser: "Forty-five minutes west — active Syracuse metro clients.",
		heroSubtitle:
			"Syracuse web design and local SEO for trades, home services, and growing regional brands.",
		metaDescription:
			"Syracuse, NY web design and local SEO — custom fast sites for contractors and service businesses competing in the Syracuse metro and Central New York.",
		intro: [
			"Syracuse is a larger, more competitive search market than the immediate Mohawk Valley. Ranking for high-intent keywords takes a fast site, clear service silos, strong on-page SEO, and a Google Business Profile strategy that matches your website story.",
			"We regularly support Syracuse-area clients with the same hands-on build process: one senior builder, modern stack, and measurable performance targets.",
		],
		sections: [
			{
				heading: "Competitive markets need structure, not fluff",
				paragraphs: [
					"When dozens of contractors bid for the same searches, Google rewards clarity: distinct pages per service line, real project photography, FAQs that match customer objections, and internal links that distribute authority intelligently.",
					"We plan IA and content modules so you can grow into more services or towns without breaking the site.",
				],
			},
			{
				heading: "Technical SEO and CRO together",
				paragraphs: [
					"Speed, mobile layout, and schema are technical signals — but they also convert. We tune hero sections, call buttons, and form flows so paid traffic and organic visitors both see a consistent story.",
				],
			},
			{
				heading: "Engage the studio",
				paragraphs: [
					"If you are Syracuse-based or serve the metro from a nearby HQ, use the contact page to request your free audit. We will map realistic wins against your current site and GBP.",
				],
			},
		],
	},
	{
		slug: "watertown-ny",
		name: "Watertown, NY",
		tag: "secondary",
		cardTeaser: "North Country coverage for service and trade businesses.",
		heroSubtitle:
			"Web design and SEO support for Watertown and the North Country service economy.",
		metaDescription:
			"Watertown, NY area web design and local SEO for North Country contractors and service businesses — remote-first delivery with Upstate NY standards.",
		intro: [
			"We support Watertown and the broader North Country with remote-first collaboration: same performance standards, same SEO discipline — with travel available when a project benefits from an on-site pass.",
			"If you run a trade or home-service business competing from Watertown through the Thousand Islands region, your website should make geography and service radius obvious to humans and search engines.",
		],
		sections: [
			{
				heading: "North Country search is hyper-local",
				paragraphs: [
					"People often include the town or installation name in queries. We help you structure location and service content so you rank for the combinations that actually drive revenue — without thin duplicate pages.",
				],
			},
			{
				heading: "Cold-weather trades have specific proof needs",
				paragraphs: [
					"Emergency service, seasonal promotions, and equipment brands are all trust signals. We surface them in layouts that still load fast on rural mobile connections.",
				],
			},
			{
				heading: "Contact",
				paragraphs: [
					"Reach out via the contact page with your URL and the towns you serve; we will recommend a site and SEO approach that fits.",
				],
			},
		],
	},
	{
		slug: "saratoga-springs",
		name: "Saratoga Springs, NY",
		tag: "primary",
		cardBadge: "LOCAL",
		cardTeaser:
			"Performance-driven digital architecture for the luxury service market.",
		heroSubtitle:
			"Custom web design and local SEO for Saratoga Springs service businesses in the luxury and high-end market.",
		metaDescription:
			"Web design for Saratoga Springs, NY — performance-first custom sites and local SEO from a 518-based studio built for the luxury service market.",
		intro: [
			"Saratoga Springs is one of the most competitive local markets in Upstate NY: affluent clientele, high expectations, and a dense field of service businesses all competing for the same high-intent searches. A templated site does not cut it here.",
			"We build performance-first, hand-coded marketing sites tuned for the luxury service segment — fast on mobile, clear on trust signals, and structured so Google understands exactly what you offer and where.",
		],
		sections: [
			{
				heading: "Why the luxury market demands a better site",
				paragraphs: [
					"Saratoga Springs searchers are sophisticated. They compare three tabs before calling. Your site needs to load in under two seconds, communicate credibility above the fold, and make the next step — call, book, or quote — obvious on a phone screen.",
				],
			},
			{
				heading: "Local SEO for a premium market",
				paragraphs: [
					"We align Google Business Profile categories with on-page content, build location-specific service pages, and structure schema so your listing stands out in the map pack for the searches that convert.",
				],
			},
			{
				heading: "Get started",
				paragraphs: [
					"Reach out via the contact page with your URL and the services you offer. We will audit your current presence and recommend a focused build or SEO plan.",
				],
			},
		],
	},
	{
		slug: "albany",
		name: "Albany, NY",
		tag: "primary",
		cardBadge: "CAPITAL REGION",
		cardTeaser: "High-performance infrastructure for the Tech Valley corridor.",
		heroSubtitle:
			"Custom web design and local SEO for Albany and the Capital Region's growing tech and service economy.",
		metaDescription:
			"Web design for Albany, NY — high-performance custom marketing sites and structured local SEO for Capital Region service businesses and tech-corridor companies.",
		intro: [
			"Albany and the Tech Valley corridor are growing fast: state government, healthcare, higher education, and a rising tech sector create real demand for professional web presence across a wide range of service verticals.",
			"We build clean, fast, custom sites that rank in Albany-area searches and convert visitors into leads — without the bloat of a generic agency stack.",
		],
		sections: [
			{
				heading: "Serving the Capital Region's competitive verticals",
				paragraphs: [
					"From contractors and medspas to professional services and SaaS companies, the Albany market rewards sites that are technically sound and locally specific. We build for both.",
				],
			},
			{
				heading: "Tech Valley SEO strategy",
				paragraphs: [
					"The corridor from Albany to Troy, Schenectady, and Saratoga has distinct search markets. We build geo-targeted service pages and consistent NAP signals so you rank in the neighborhoods and towns where your customers actually are.",
				],
			},
			{
				heading: "Contact us",
				paragraphs: [
					"Send your site URL and a short note about your goals through the contact page. We will respond with an honest assessment and a proposed next step.",
				],
			},
		],
	},
] as const;

const bySlug = new Map(
	serviceAreaLocations.map((loc) => [loc.slug, loc] as const),
);

export function getServiceAreaLocation(
	slug: string,
): ServiceAreaLocation | undefined {
	return bySlug.get(slug);
}

export function getAllServiceAreaSlugs(): string[] {
	return serviceAreaLocations.map((l) => l.slug);
}

export function isServiceAreaSlug(slug: string): boolean {
	return bySlug.has(slug);
}

/** URL segment → display label for breadcrumbs (e.g. `rome-ny` → `Rome, NY`). */
export const serviceAreaSlugLabels: Record<string, string> = (() => {
	const labels: Record<string, string> = {};
	for (const location of serviceAreaLocations) {
		labels[location.slug] = location.name;
	}
	return labels;
})();
