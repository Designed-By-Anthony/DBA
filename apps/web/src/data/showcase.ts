import bakeryDemo from "../assets/portfolio/bakery_demo.webp";
import handymanDemo from "../assets/portfolio/handyman_demo.webp";
import landscapeDemo from "../assets/portfolio/landscape_demo.webp";
import plumberDemo from "../assets/portfolio/plumber_demo.webp";
import rooferDemo from "../assets/portfolio/roofer_demo.webp";

export type ShowcaseStatus = "example" | "in-progress";

export interface ShowcaseFeature {
	label: string;
	detail: string;
}

export interface ShowcaseItem {
	status: ShowcaseStatus;
	statusLabel: string;
	industry: string;
	name: string;
	description: string;
	problem: string;
	solution: string;
	href?: string;
	caseStudySlug?: string;
	image: string;
	/** Optimized source for next/image when available */
	displayImage?: typeof handymanDemo;
	imageAlt?: string;
	featured?: boolean;
	note?: string;
	features?: ShowcaseFeature[];
}

export const showcaseItems: ShowcaseItem[] = [
	{
		status: "example",
		statusLabel: "Client Build",
		industry: "Handyman",
		name: "The Long Beach Handyman",
		description:
			"A custom handyman website for a contractor in Long Beach, CA — built turn-key so the owner can manage content and track site performance without relying on a developer.",
		problem:
			"This Long Beach handyman needed a professional website he could run himself — update service pages, swap project photos, and change copy without hiring a developer every time. He also needed a mobile-friendly design and visibility into site traffic and search performance.",
		solution:
			"We designed and built a custom small business website on a headless CMS, giving the owner full control of every page from a visual dashboard. Contact forms route to his inbox, Google Analytics and Search Console track traffic and local search rankings, and an interactive service area map clarifies coverage in Long Beach and surrounding cities. The result is a fast-loading, mobile-responsive contractor website the owner runs day to day without ongoing developer dependency.",
		href: "https://thelongbeachhandyman.com/",
		caseStudySlug: "the-long-beach-handyman",
		image: handymanDemo.src,
		displayImage: handymanDemo,
		imageAlt:
			"Custom handyman website design for The Long Beach Handyman — a client build by ANTHONY. featuring local SEO, lead capture, and mobile-friendly responsive design",
		featured: true,
		features: [
			{
				label: "Owner-managed CMS",
				detail:
					"Built on Storyblok, a headless content management system that lets the owner update service pages, project photos, and website copy from a visual dashboard — no code and no ongoing developer dependency.",
			},
			{
				label: "Built-in lead capture",
				detail:
					"Every contact form runs through Web3Forms so lead inquiries go straight to the owner's inbox in real time. No missed phone calls or quote requests, and no third-party CRM required to start generating leads from the website.",
			},
			{
				label: "Analytics and Search Console",
				detail:
					"Google Analytics and Google Search Console are connected from day one, giving the owner clear visibility into website traffic, page performance, local search rankings, and which service pages drive the most phone calls and conversions.",
			},
			{
				label: "Near-perfect Lighthouse performance",
				detail:
					"Custom-coded in Next.js with React Server Components — a lean stack that ships minimal JavaScript for content pages. The result is a fast-loading, mobile-friendly website with strong Google Lighthouse scores across performance, accessibility, best practices, and SEO.",
			},
			{
				label: "Interactive service area map",
				detail:
					"An embedded Google Maps integration highlights every neighborhood and city the handyman serves across Long Beach, CA, making it immediately clear to local homeowners whether they are in the service coverage zone.",
			},
		],
	},

	{
		status: "example",
		statusLabel: "Example Build",
		industry: "Roofing",
		name: "Summit Roofing",
		description:
			"A roofing example build focused on credibility, clearer service framing, and a more confident estimate path.",
		problem:
			"Roofing is a high-trust, high-dollar decision. Homeowners need to believe you are established and reliable before they will hand over a deposit.",
		solution:
			"Professional presentation that communicates experience, clear positioning on services and coverage area, and a simple path for homeowners to request an estimate.",
		href: "https://roofing-demo.web.app/",
		image: rooferDemo.src,
		displayImage: rooferDemo,
		imageAlt: "Summit Roofing example website by ANTHONY.",
		featured: true,
	},
	{
		status: "example",
		statusLabel: "Example Build",
		industry: "Landscaping",
		name: "Apex Landscaping & Snow Removal",
		description:
			"A landscaping example build with clearer service breakdowns and a stronger quote-request path for homeowners.",
		problem:
			"Landscaping companies often cram every service onto one page and hope someone calls. This build separates services clearly so homeowners can find exactly what they need.",
		solution:
			"Clear service breakdowns, a professional feel that matches the quality of the outdoor work, and a layout that moves visitors toward a quote request.",
		href: "https://designed-by-anthony-c18bd.web.app/",
		image: landscapeDemo.src,
		displayImage: landscapeDemo,
		imageAlt: "Apex Landscaping and Snow Removal example website by ANTHONY.",
	},
	{
		status: "example",
		statusLabel: "Example Build",
		industry: "Food and Beverage",
		name: "Marble & Bloom Bakery",
		description:
			"A premium launch-page example showing how atmosphere, copy, and conversion flow can be tailored to a specific audience.",
		problem:
			"Most bakery and food service websites use the same template as every other business in town. This build shows what happens when the design and copy are shaped for a specific audience.",
		solution:
			"A premium launch page with strong atmosphere, focused messaging, and a clear path for first-time visitors to become repeat customers.",
		href: "https://food-service-demo-c7ecd.web.app/",
		image: bakeryDemo.src,
		displayImage: bakeryDemo,
		imageAlt: "Marble & Bloom Bakery example website by ANTHONY.",
	},
	{
		status: "example",
		statusLabel: "Example Build",
		industry: "Plumbing",
		name: "Copperline Plumbing",
		description:
			"A plumbing example build designed for fast first impressions, stronger trust, and an easier path to the phone on mobile.",
		problem:
			"Homeowners searching for a plumber are usually in a hurry and comparing options fast. A slow or generic site loses the call before the page finishes loading.",
		solution:
			"Clear emergency messaging, strong local positioning, and a mobile experience designed so calling is the easiest action on the page.",
		href: "https://plumber-demo-404e2.web.app/",
		image: plumberDemo.src,
		displayImage: plumberDemo,
		imageAlt: "Copperline Plumbing example website by ANTHONY.",
		featured: true,
	},
];

export const showcaseExampleItems = showcaseItems.filter(
	(item): item is ShowcaseItem & { status: "example"; href: string } =>
		item.status === "example",
);

export const showcaseFeaturedItems = showcaseExampleItems.filter(
	(item) => item.featured,
);

export const showcaseInProgressItems = showcaseItems.filter(
	(
		item,
	): item is ShowcaseItem & {
		status: "in-progress";
		note: string;
	} => item.status === "in-progress",
);
