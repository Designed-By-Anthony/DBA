/**
 * Optional cover presentation for very dark artwork on the dark site shell.
 * Replace with a brighter asset when ready — then remove `liftOnDark`.
 */
export type BlogCoverPresentation = "liftOnDark";

export interface BlogPostMeta {
	title: string;
	excerpt: string;
	image: string;
	imageAlt: string;
	imageWidth: number;
	imageHeight: number;
	/** When set, index + article apply contrast framing so the cover reads on dark backgrounds. */
	coverPresentation?: BlogCoverPresentation;
	publishedTime: string;
	displayDate: string;
	readTime: string;
	url: string;
}

export const blogPosts: BlogPostMeta[] = [
	{
		title:
			"Google Business Profile: The 2026 Playbook for CNY Service Businesses",
		excerpt:
			"GBP changed fast — AI calling, freshness pressure, visual ranking, and Ask Maps. Here is a Central New York field guide for plumbers, HVAC, and home-service crews who live in the Map Pack.",
		image: "/images/gbp_2026_cny_playbook_cover.png",
		imageAlt:
			"Abstract dark map grid with brass and blue location pins and signal rings — custom artwork for Google Business Profile 2026 Central New York guide",
		imageWidth: 1024,
		imageHeight: 1024,
		coverPresentation: "liftOnDark",
		publishedTime: "2026-04-25T09:00:00-04:00",
		displayDate: "April 25, 2026",
		readTime: "16 min read",
		url: "/blog/google-business-profile-2026-cny-playbook",
	},
	{
		title: "Upstate NY Local SEO 2026",
		excerpt:
			"How plumbers, HVAC, landscapers, and contractors across Albany, Syracuse, Rochester, Buffalo, and the Capital Region can win Google Maps and local search without NYC-sized budgets.",
		image: "/images/upstate_local_seo_cover.webp",
		imageAlt:
			"Upstate New York landscape suggesting local service businesses and regional search visibility",
		imageWidth: 2752,
		imageHeight: 1536,
		publishedTime: "2026-04-13T09:00:00-04:00",
		displayDate: "April 13, 2026",
		readTime: "13 min read",
		url: "/blog/upstate-ny-local-seo-service-businesses-2026",
	},
	{
		title: "Seasonal SEO in Central New York",
		excerpt:
			"How seasonal businesses in Central New York can use local SEO, content planning, and profile updates to stay visible year-round.",
		image: "/images/seasonal_seo_cover.png",
		imageAlt:
			"Modern office workspace with panoramic view of seasonal Central New York landscape showing transition between winter and spring",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-04-15T09:00:00-05:00",
		displayDate: "April 15, 2026",
		readTime: "7 min read",
		url: "/blog/seasonal-business-seo",
	},
	{
		title: "Fix Thin Content Without Hurting SEO",
		excerpt:
			"A practical guide to finding thin pages, improving weak content, and consolidating low-value URLs without hurting SEO.",
		image: "/images/thin_content_cover.png",
		imageAlt:
			"Executive meeting room with premium SEO data reports and content audit documentation spread across a dark marble conference table",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-04-10T09:00:00-05:00",
		displayDate: "April 10, 2026",
		readTime: "7 min read",
		url: "/blog/fix-thin-content",
	},
	{
		title: "Website audits — Utica & CNY",
		excerpt:
			"What a Lighthouse-style audit measures for Utica, Rome, Syracuse, and CNY service businesses — and how to get a human read on your results through our contact page.",
		image: "/images/lighthouse_audit_cover.png",
		imageAlt:
			"Lighthouse beam scanning a cityscape revealing website performance metrics for Central New York service businesses",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-04-07T22:00:00-04:00",
		displayDate: "April 7, 2026",
		readTime: "8 min read",
		url: "/blog/free-lighthouse-audit-utica-ny",
	},
	{
		title: "Next.js vs Wix for Local Service Sites",
		excerpt:
			"A practical comparison of Next.js and Wix for SEO, page speed, and long-term flexibility — with examples from Naples, Houston, and Central NY.",
		image: "/images/nextjs_vs_wix_cover.png",
		imageAlt:
			"Side-by-side comparison of Next.js code architecture and Wix website builder interface highlighting performance and SEO differences",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-04-05T09:00:00-05:00",
		displayDate: "April 5, 2026",
		readTime: "7 min read",
		url: "/blog/nextjs-vs-wix",
	},
	{
		title: "How Much Does a Website Cost in 2026?",
		excerpt:
			"A transparent breakdown of website costs in 2026, with real price ranges and what small businesses usually get at each level.",
		image: "/images/website_cost_cover.png",
		imageAlt:
			"Digital calculator and price tag beside a website wireframe showing website cost breakdown for small businesses",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-04-03T09:00:00-04:00",
		displayDate: "April 3, 2026",
		readTime: "10 min read",
		url: "/blog/website-cost",
	},
	{
		title: "Why Monthly SEO Matters for Local Service Businesses",
		excerpt:
			"A practical look at why local SEO needs monthly follow-through, what should be included, and where directory work actually fits.",
		image: "/images/local_seo_cover.png",
		imageAlt:
			"Local SEO dashboard and search visibility visuals for a service business",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-04-02T10:30:00-04:00",
		displayDate: "April 2, 2026",
		readTime: "12 min read",
		url: "/blog/why-monthly-seo-matters",
	},
	{
		title: "5 Common Contractor Website Mistakes — From Utica to Houston",
		excerpt:
			"The most common contractor website mistakes that cost service businesses leads — with real examples from Utica, Rome, Columbus, Houston, and the North Country.",
		image: "/images/contractor_mistakes_cover.png",
		imageAlt:
			"Construction contractor reviewing project plans at a job site highlighting common website design mistakes",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-03-31T09:00:00-04:00",
		displayDate: "March 31, 2026",
		readTime: "8 min read",
		url: "/blog/contractor-website-mistakes",
	},
	{
		title: "Mobile SEO: Speed Wins Local Leads",
		excerpt:
			"Google indexes the mobile version of your site first. Slow mobile pages hurt rankings and calls—from FL and OH to Upstate NY.",
		image: "/images/mobile_first_seo_cover.png",
		imageAlt:
			"Smartphone displaying a lightning-fast mobile website with speed metrics overlay on dark background",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-03-28T09:00:00-04:00",
		displayDate: "March 28, 2026",
		readTime: "11 min read",
		url: "/blog/mobile-first-seo",
	},
	{
		title: "CNY LocalBusiness Schema Guide",
		excerpt:
			"How LocalBusiness schema helps Syracuse and Utica service businesses strengthen Map Pack visibility and local search relevance.",
		image: "/images/local_schema_cover_v2.png",
		imageAlt:
			"Network of connected business location pins over a dark map with JSON-LD structured data code visualization",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-03-27T09:00:00-04:00",
		displayDate: "March 27, 2026",
		readTime: "12 min read",
		url: "/blog/local-business-schema",
	},
	{
		title: "Why Site Speed Still Costs Leads",
		excerpt:
			"A practical look at why page speed still costs service businesses real money — with examples from Houston, Miami, and Central New York.",
		image: "/images/speed_conversion_cover.png",
		imageAlt:
			"Speedometer gauge hitting green zone fused with website conversion funnel showing performance impact on leads",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-03-15T09:00:00-04:00",
		displayDate: "March 15, 2026",
		readTime: "10 min read",
		url: "/blog/site-speed-conversion",
	},
	{
		title: "Technical Local SEO for Utica & Central NY Service Businesses",
		excerpt:
			"A local SEO guide for Utica, Rome, Syracuse, and Central New York service businesses covering structure, mobile-first SEO, schema, and Map Pack gains.",
		image: "/images/local_seo_visibility_cover.png",
		imageAlt:
			"Map location pins fading from bright to dim spreading outward from a central business representing local search visibility",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-02-28T09:00:00-05:00",
		displayDate: "February 28, 2026",
		readTime: "12 min read",
		url: "/blog/local-seo-death",
	},
	{
		title: "Marketing Sites Built with Next.js",
		excerpt:
			"A source-backed look at why we choose Next.js over builders for local-business marketing websites — from Manhattan to the Mohawk Valley.",
		image: "/images/nextjs_stack_cover.png",
		imageAlt:
			"Minimalist rocket ship made of code lines launching upward with blue exhaust trails representing a high-performance Next.js stack",
		imageWidth: 1024,
		imageHeight: 1024,
		publishedTime: "2026-02-10T09:00:00-05:00",
		displayDate: "February 10, 2026",
		readTime: "12 min read",
		url: "/blog/nextjs-marketing-stack",
	},
];
