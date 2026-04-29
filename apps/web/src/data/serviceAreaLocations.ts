/**
 * Local / regional landing pages under `/service-areas/[slug]`.
 * Keep slugs URL-safe and stable; copy should match what we actually serve.
 */
export type ServiceAreaTag = "primary" | "secondary";

export interface ServiceAreaLocation {
	slug: string;
	name: string;
	tag: ServiceAreaTag;
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
			"Rome is our home base: when you hire Designed by Anthony, you are working with a builder who lives and works in the same market you serve. That matters for local nuance — how people search for plumbers, HVAC, medspas, and professional services across Oneida County — and for timelines when you want to meet in person.",
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
		slug: "naples-fl",
		name: "Naples, FL",
		tag: "secondary",
		cardTeaser: "Select remote clients in the Southwest Florida market.",
		heroSubtitle:
			"Remote web design engagements for qualified Naples and Southwest Florida service businesses.",
		metaDescription:
			"Remote web design for Naples, FL service businesses — performance-first builds and SEO-friendly structure from an Upstate NY studio with select Florida clients.",
		intro: [
			"We take a small number of remote clients in Southwest Florida when the fit is right: typically service businesses that want a senior builder, tight scope control, and a site that is not chained to a generic page builder.",
			"Delivery is remote-first with scheduled video working sessions; we align on brand, SEO targets, and integrations up front so distance is not a bottleneck.",
		],
		sections: [
			{
				heading: "Why remote still works for premium sites",
				paragraphs: [
					"Modern tooling makes reviews, approvals, and launches straightforward without daily on-site presence. What matters is clear communication, a written scope, and a staging environment you can click through on your phone.",
				],
			},
			{
				heading: "Florida-local SEO from honest geography",
				paragraphs: [
					"We only target cities you truly serve and align GBP categories with on-page content. Search engines and customers both punish fake locality — we build to the markets you can defend in real life.",
				],
			},
			{
				heading: "Availability",
				paragraphs: [
					"Use the contact page to describe your business and goals. If we are at capacity for Florida remote work, we will say so directly and suggest alternatives.",
				],
			},
		],
	},
	{
		slug: "houston-tx",
		name: "Houston, TX",
		tag: "secondary",
		cardTeaser: "Remote engagements for qualified service businesses.",
		heroSubtitle:
			"Remote custom websites and SEO-friendly builds for Houston-area service companies.",
		metaDescription:
			"Remote web design for Houston, TX service businesses — fast custom marketing sites and structured local SEO support from Designed by Anthony.",
		intro: [
			"Houston is a massive, competitive metro. We do not pretend to be a Houston storefront agency — we partner selectively with service businesses that want a senior engineer-led site, transparent pricing, and a stack that will not rot behind a pile of plugins.",
			"Engagements are remote-first with clear milestones; we integrate the booking, CRM, and analytics tools you already use where possible.",
		],
		sections: [
			{
				heading: "Standing out in a crowded metro",
				paragraphs: [
					"Differentiation is rarely a bigger slider hero — it is proof, clarity, and speed. We help you present services, services areas, and conversion paths so paid and organic traffic land on pages built to close.",
				],
			},
			{
				heading: "SEO expectations we will actually underwrite",
				paragraphs: [
					"We will tell you what on-page and technical fixes can realistically change, how GBP fits in, and what requires ongoing content or ads. No vague guarantees — just an execution plan tied to your geography and vertical.",
				],
			},
			{
				heading: "Start a conversation",
				paragraphs: [
					"Send your site and a short note through the contact page. If the scope fits how we work, we will propose next steps; if not, we will point you in a better direction.",
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
