export type SchemaValue = Record<string, unknown>;

export interface BreadcrumbItem {
	name: string;
	path: string;
}

export interface FaqEntry {
	question: string;
	answer: string;
}

interface ServiceSchemaInput {
	name: string;
	description: string;
	path: string;
	image?: string;
	category?: string;
	serviceType?: string;
}

interface ServiceAreaSchemaInput {
	name: string;
	description: string;
	path: string;
	areaServed: string;
	serviceType?: string;
	geo?: {
		latitude: number;
		longitude: number;
	};
	cityName?: string;
	regionName?: string;
	regionAbbr?: string;
}

interface BlogPostingSchemaInput {
	headline: string;
	description: string;
	path: string;
	image: string;
	datePublished: string;
	dateModified?: string;
	articleSection?: string;
	keywords?: string[];
}

interface ItemListSchemaInput {
	name: string;
	description?: string;
	path: string;
	items: Array<{
		name: string;
		url: string;
		description?: string;
		image?: string;
	}>;
}

import { BRAND_ASSETS } from "@/design-system/brand";
import {
	AGENCY_OS_APP_URL,
	AGENCY_OS_CAPTURE_LABEL,
	AGENCY_OS_CAPTURE_MONTHLY,
	AGENCY_OS_SUITE_LABEL,
	AGENCY_OS_SUITE_MONTHLY,
	FOUNDING_PARTNER_SEO_MONTHLY,
	GBP_FULL_PROGRAM_MONTHLY_PRICE,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "./offers";

export const SITE_URL = "https://designedbyanthony.com";
export const SITE_NAME = "Designed by Anthony";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/about#person`;
/** Stable JSON-LD @id for Agency OS (CRM) — admin app origin. */
export const AGENCY_OS_SOFTWARE_ID = `${AGENCY_OS_APP_URL}/#software`;
export const GA_MEASUREMENT_ID = "G-4RSTBMRHDW";
export const GOOGLE_BUSINESS_PROFILE_URL =
	"https://www.google.com/search?kgmid=/g/11z36l4fmd&q=Designed+By+Anthony";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/images/og-site-premium.png`;
export const SITE_LICENSE_PAGE = `${SITE_URL}/image-license`;
export const SITE_COPYRIGHT = `© ${new Date().getFullYear()} Designed by Anthony. All rights reserved.`;
export const FACEBOOK_PROFILE_URL =
	"https://www.facebook.com/profile.php?id=61574388797744";
export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/dbastudio315/";
export const YELP_BUSINESS_URL =
	"https://www.yelp.com/biz/designed-by-anthony-rome-2";

/** Richer org description for JSON-LD (Organization / ProfessionalService / LocalBusiness). */
export const ORGANIZATION_SCHEMA_DESCRIPTION =
	"Designed by Anthony specializes in building custom, high-performance websites, Agency OS (CRM with client portal and automations), and powerful local SEO for home service businesses and contractors. Most contractor websites use generic templates that fail to rank in their service area or convert visitors. We hand-craft mobile-first, high-speed websites with LocalBusiness Schema and optimized content so you dominate the Google Map Pack and stop losing leads to your competitors. Whether you need a website rescue, monthly SEO, CRM-led follow-up, or just a faster site—let us handle the code while you focus on the jobs.";

export const businessProfile = {
	name: SITE_NAME,
	alternateName: ["designedbyanthony.com"],
	legalName: SITE_NAME,
	url: SITE_URL,
	contactPage: `${SITE_URL}/contact`,
	email: "anthony@designedbyanthony.com",
	telephone: "+1-315-922-5592",
	telephoneHref: "tel:+13159225592",
	founderName: "Anthony Jones",
	founderJobTitle: "Founder, Web Designer, and Developer",
	founderDescription:
		"Marine Corps veteran and founder of Designed by Anthony, building custom websites, Agency OS (CRM, client portal, automations), managed hosting, website rescues, and local SEO systems for service businesses.",
	description:
		"Designed by Anthony builds custom websites, Agency OS (CRM, client portal, automations), website rescues, managed hosting, and local SEO systems for service businesses.",
	logo: `${SITE_URL}${BRAND_ASSETS.logo}`,
	/** Back-compat — existing `/images/designed-by-anthony-logo.png` is still mirrored and indexed. */
	legacyLogo: `${SITE_URL}/images/designed-by-anthony-logo.png`,
	image: `${SITE_URL}/images/og-site-premium.png`,
	priceRange: "$$",
	homeBase: "Rome, New York",
	addressLocality: "Rome",
	regionAbbr: "NY",
	addressCountry: "US",
	/** Full mailing address — used in JSON-LD only (not rendered on pages); GBP remains service-area. */
	streetAddress: "7749 Kilbourn Rd",
	postalCode: "13440",
	/** Approximate home-base coordinates (Rome, NY area) for LocalBusiness / ProfessionalService geo. */
	geo: {
		latitude: 43.20115029999999,
		longitude: -75.3742007,
	},
	currenciesAccepted: "USD",
	paymentAccepted: "Cash, Credit Card",
	areaServed: [
		"Rome, New York",
		"Utica, New York",
		"New Hartford, New York",
		"Clinton, New York",
		"Syracuse, New York",
		"Naples, Florida",
		"Houston, Texas",
		"United States",
	],
	knowsAbout: [
		"Custom web design",
		"Next.js websites",
		"Local SEO",
		"Managed hosting",
		"Website rescues",
		"Website optimization",
		"Lead generation websites",
		"CRM software",
		"Client portal",
		"Marketing automation",
	],
	sameAs: [
		GOOGLE_BUSINESS_PROFILE_URL,
		FACEBOOK_PROFILE_URL,
		INSTAGRAM_PROFILE_URL,
		YELP_BUSINESS_URL,
	],
};

/** Opening hours aligned with Google Business Profile listing (JSON-LD). */
const businessOpeningHoursSpecification: SchemaValue[] = [
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Sunday",
		opens: "08:00",
		closes: "23:30",
	},
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Monday",
		opens: "17:30",
		closes: "23:30",
	},
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Tuesday",
		opens: "17:30",
		closes: "23:30",
	},
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Wednesday",
		opens: "17:30",
		closes: "23:30",
	},
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Thursday",
		opens: "17:30",
		closes: "23:30",
	},
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Friday",
		opens: "17:30",
		closes: "23:30",
	},
	{
		"@type": "OpeningHoursSpecification",
		dayOfWeek: "https://schema.org/Saturday",
		opens: "08:00",
		closes: "23:30",
	},
];

const coreServiceCatalog = [
	{
		name: "Custom Web Design",
		path: "/services/custom-web-design",
		description:
			"Custom websites built for trust, speed, clarity, and lead generation.",
	},
	{
		name: "Website Rescues and Mobile Optimization",
		path: "/services/website-rescue",
		description:
			"Website rescue work that improves mobile usability, speed, and conversion flow.",
	},
	{
		name: "Managed Hosting and VIP Support",
		path: "/services/managed-hosting",
		description:
			"Managed hosting and direct support that keep the site fast, secure, and easy to maintain.",
	},
	{
		name: "Local SEO and Search Visibility",
		path: "/services/local-seo",
		description:
			"Local SEO and Google Business Profile work — Merchynt agency partner — aligning service pages, areas, and entity signals.",
	},
	{
		name: "Google Business Profile & Local Marketing",
		path: "/services/google-business-profile",
		description:
			"Complete local marketing program around Google Business Profile, reviews, citations, AI visibility, and reporting — Merchynt agency partner.",
	},
];

/** Builds a fully-attributed ImageObject for images owned by this site. */
export function buildOwnedImageObject(url: string): SchemaValue {
	return {
		"@type": "ImageObject",
		url: toAbsoluteUrl(url),
		acquireLicensePage: SITE_LICENSE_PAGE,
		copyrightNotice: SITE_COPYRIGHT,
		creator: {
			"@type": "Organization",
			name: SITE_NAME,
			url: SITE_URL,
		},
		creditText: SITE_NAME,
	};
}

function buildPostalAddress(): SchemaValue {
	return {
		"@type": "PostalAddress",
		streetAddress: businessProfile.streetAddress,
		addressLocality: businessProfile.addressLocality,
		addressRegion: businessProfile.regionAbbr,
		postalCode: businessProfile.postalCode,
		addressCountry: businessProfile.addressCountry,
	};
}

/** Builds a fully-attributed ImageObject for Unsplash images. */
export function buildUnsplashImageObject(url: string): SchemaValue {
	return {
		"@type": "ImageObject",
		url,
		acquireLicensePage: "https://unsplash.com/license",
		license: "https://unsplash.com/license",
		copyrightNotice: "Licensed under the Unsplash License",
		creator: {
			"@type": "Organization",
			name: "Unsplash",
			url: "https://unsplash.com",
		},
		creditText: "Unsplash",
	};
}

/** Returns the correct ImageObject based on whether the URL is from Unsplash. */
export function buildImageObject(url: string): SchemaValue {
	const absoluteUrl = /^https?:\/\//i.test(url) ? url : toAbsoluteUrl(url);
	if (absoluteUrl.includes("unsplash.com")) {
		return buildUnsplashImageObject(absoluteUrl);
	}
	/* Self-hosted mirrors of Unsplash downloads — filename convention from export */
	if (/-unsplash-/i.test(absoluteUrl)) {
		return {
			"@type": "ImageObject",
			url: absoluteUrl,
			acquireLicensePage: "https://unsplash.com/license",
			license: "https://unsplash.com/license",
			copyrightNotice: "Licensed under the Unsplash License",
			creator: {
				"@type": "Organization",
				name: "Unsplash",
				url: "https://unsplash.com",
			},
			creditText: "Unsplash",
		};
	}
	return buildOwnedImageObject(absoluteUrl);
}

const breadcrumbLabelMap: Record<string, string> = {
	blog: "Blog",
	contact: "Contact",
	cookie: "Cookie Policy",
	faq: "FAQ",
	ouredge: "Our Edge",
	portfolio: "Portfolio",
	pricing: "Pricing",
	privacy: "Privacy Policy",
	services: "Services",
	"service-areas": "Service Areas",
	terms: "Terms of Service",
	"thank-you": "Thank You",
	"404": "404",
	"google-business-profile": "Google Business Profile",
};

export function normalizePath(path: string): string {
	if (!path || path === "/") {
		return "/";
	}

	const pathname = path.startsWith("/") ? path : `/${path}`;

	if (/\/index\.html$/i.test(pathname) || pathname === "/index.html") {
		return "/";
	}

	if (/\.html$/i.test(pathname)) {
		return pathname.replace(/\.html$/i, "");
	}

	if (/\.[a-z0-9]+$/i.test(pathname)) {
		return pathname;
	}

	return pathname.replace(/\/+$/, "");
}

export function toAbsoluteUrl(path: string): string {
	if (/^https?:\/\//i.test(path)) {
		return path;
	}

	const normalized = normalizePath(path);
	// Match sitemap + trailingSlash: 'never' — avoid https://domain/ vs https://domain duplicate signals.
	if (normalized === "/") {
		return SITE_URL;
	}

	return new URL(normalized, SITE_URL).toString();
}

export function stripSiteSuffix(title: string): string {
	return title.replace(/\s*\|\s*Designed by Anthony\s*$/i, "").trim();
}

function startCase(value: string): string {
	return value
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function toPlace(name: string): SchemaValue {
	if (name === "United States") {
		return {
			"@type": "Country",
			name,
		};
	}

	return {
		"@type": "Place",
		name,
	};
}

function buildCoreServiceOffers(): SchemaValue[] {
	return coreServiceCatalog.map((service) => {
		const url = toAbsoluteUrl(service.path);

		return {
			"@type": "Offer",
			url,
			itemOffered: {
				"@type": "Service",
				"@id": `${url}#service`,
				name: service.name,
				description: service.description,
				url,
			},
		};
	});
}

function buildCoreServiceOfferCatalog(): SchemaValue {
	return {
		"@type": "OfferCatalog",
		name: "Digital Services",
		itemListElement: buildCoreServiceOffers(),
	};
}

export function buildBreadcrumbs(
	pathname: string,
	currentLabel: string,
): BreadcrumbItem[] {
	const segments = normalizePath(pathname).split("/").filter(Boolean);

	if (segments.length === 0) {
		return [];
	}

	let accumulatedPath = "";

	const items: BreadcrumbItem[] = [
		{
			name: "Home",
			path: "/",
		},
	];

	segments.forEach((segment, index) => {
		accumulatedPath += `/${segment}`;
		const isLast = index === segments.length - 1;

		items.push({
			name: isLast
				? currentLabel
				: (breadcrumbLabelMap[segment] ?? startCase(segment)),
			path: normalizePath(accumulatedPath),
		});
	});

	return items;
}

export function buildBreadcrumbSchema(
	pathname: string,
	items: BreadcrumbItem[],
): SchemaValue | null {
	if (items.length < 2) {
		return null;
	}

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"@id": `${toAbsoluteUrl(pathname)}#breadcrumb`,
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: toAbsoluteUrl(item.path),
		})),
	};
}

export function buildServiceSchema(input: ServiceSchemaInput): SchemaValue {
	const url = toAbsoluteUrl(input.path);

	return {
		"@context": "https://schema.org",
		"@type": "Service",
		"@id": `${url}#service`,
		name: input.name,
		description: input.description,
		serviceType: input.serviceType ?? input.name,
		category: input.category ?? input.name,
		url,
		image: input.image ? [buildImageObject(input.image)] : undefined,
		mainEntityOfPage: {
			"@id": `${url}#webpage`,
		},
		provider: {
			"@type": "Organization",
			"@id": ORGANIZATION_ID,
		},
		areaServed: businessProfile.areaServed.map(toPlace),
		availableChannel: {
			"@type": "ServiceChannel",
			serviceUrl: toAbsoluteUrl("/contact"),
			availableLanguage: "en-US",
		},
		termsOfService: toAbsoluteUrl("/terms"),
	};
}

export function buildServiceAreaSchema(
	input: ServiceAreaSchemaInput,
): SchemaValue[] {
	const url = toAbsoluteUrl(input.path);
	const areaId = `${url}#area`;

	const serviceSchema: SchemaValue = {
		"@context": "https://schema.org",
		"@type": "Service",
		"@id": `${url}#service-area`,
		name: input.name,
		description: input.description,
		serviceType:
			input.serviceType ??
			"Custom web design, website rescue, managed hosting, and local SEO",
		category: "Web design, website rescue, managed hosting, and local SEO",
		url,
		mainEntityOfPage: {
			"@id": `${url}#webpage`,
		},
		provider: {
			"@type": "Organization",
			"@id": ORGANIZATION_ID,
		},
		areaServed: {
			"@id": areaId,
		},
		availableChannel: {
			"@type": "ServiceChannel",
			serviceUrl: toAbsoluteUrl("/contact"),
			availableLanguage: "en-US",
		},
		offers: buildCoreServiceOffers(),
		termsOfService: toAbsoluteUrl("/terms"),
	};

	const placeSchema: SchemaValue = {
		"@context": "https://schema.org",
		"@type": "Place",
		"@id": areaId,
		name: input.areaServed,
		address: {
			"@type": "PostalAddress",
			addressLocality: input.cityName ?? input.areaServed,
			addressRegion: input.regionAbbr ?? businessProfile.regionAbbr,
			addressCountry: "US",
		},
		...(input.geo
			? {
					geo: {
						"@type": "GeoCoordinates",
						latitude: input.geo.latitude,
						longitude: input.geo.longitude,
					},
				}
			: {}),
	};

	return [serviceSchema, placeSchema];
}

export function buildBlogPostingSchema(
	input: BlogPostingSchemaInput,
): SchemaValue {
	const url = toAbsoluteUrl(input.path);

	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		"@id": `${url}#article`,
		headline: input.headline,
		description: input.description,
		url,
		mainEntityOfPage: {
			"@id": `${url}#webpage`,
		},
		image: [buildImageObject(input.image)],
		datePublished: input.datePublished,
		dateModified: input.dateModified ?? input.datePublished,
		articleSection: input.articleSection,
		keywords: input.keywords,
		author: {
			"@type": "Person",
			"@id": PERSON_ID,
			name: businessProfile.founderName,
			url: toAbsoluteUrl("/about"),
		},
		publisher: {
			"@type": "Organization",
			"@id": ORGANIZATION_ID,
			name: SITE_NAME,
			logo: buildOwnedImageObject(businessProfile.logo),
			url: SITE_URL,
		},
		isPartOf: {
			"@type": "Blog",
			"@id": `${toAbsoluteUrl("/blog")}#blog`,
			name: "The Main Street Blog",
			url: toAbsoluteUrl("/blog"),
		},
		inLanguage: "en-US",
	};
}

export function buildFaqPageSchema(entries: FaqEntry[]): SchemaValue {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: entries.map((entry) => ({
			"@type": "Question",
			name: entry.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: entry.answer,
			},
		})),
	};
}

export function buildItemListSchema(input: ItemListSchemaInput): SchemaValue {
	const url = toAbsoluteUrl(input.path);

	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		"@id": `${url}#itemlist`,
		name: input.name,
		description: input.description,
		itemListOrder: "https://schema.org/ItemListOrderAscending",
		numberOfItems: input.items.length,
		itemListElement: input.items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			item: {
				"@type": "WebPage",
				"@id": toAbsoluteUrl(item.url),
				name: item.name,
				description: item.description,
				image: item.image ? toAbsoluteUrl(item.image) : undefined,
				url: toAbsoluteUrl(item.url),
			},
		})),
	};
}

export function buildBaseOrganizationSchema(): SchemaValue {
	return {
		"@context": "https://schema.org",
		"@type": ["Organization", "ProfessionalService", "LocalBusiness"],
		"@id": ORGANIZATION_ID,
		name: businessProfile.name,
		alternateName: businessProfile.alternateName,
		legalName: businessProfile.legalName,
		url: businessProfile.url,
		logo: buildOwnedImageObject(businessProfile.logo),
		image: buildOwnedImageObject(businessProfile.image),
		description: ORGANIZATION_SCHEMA_DESCRIPTION,
		email: businessProfile.email,
		telephone: businessProfile.telephone,
		priceRange: businessProfile.priceRange,
		currenciesAccepted: businessProfile.currenciesAccepted,
		paymentAccepted: businessProfile.paymentAccepted,
		address: buildPostalAddress(),
		geo: {
			"@type": "GeoCoordinates",
			latitude: businessProfile.geo.latitude,
			longitude: businessProfile.geo.longitude,
		},
		openingHoursSpecification: businessOpeningHoursSpecification,
		founder: {
			"@id": PERSON_ID,
		},
		foundingLocation: toPlace(businessProfile.homeBase),
		areaServed: businessProfile.areaServed.map(toPlace),
		/**
		 * Dual-shape serviceArea: a 50-mile GeoCircle anchored at the Rome, NY home base
		 * (covers Utica / Rome / Syracuse / greater Mohawk Valley) plus the named
		 * place list for broader markets. Google's LocalBusiness guidance prefers
		 * GeoCircle for service-area businesses without a public storefront.
		 */
		serviceArea: [
			{
				"@type": "GeoCircle",
				geoMidpoint: {
					"@type": "GeoCoordinates",
					latitude: businessProfile.geo.latitude,
					longitude: businessProfile.geo.longitude,
				},
				geoRadius: "80467",
				description:
					"50-mile service radius from Rome, NY — covers Utica, Rome, Syracuse, and the greater Mohawk Valley / Central New York region.",
			},
			...businessProfile.areaServed.map(toPlace),
		],
		brand: {
			"@type": "Brand",
			name: SITE_NAME,
			url: SITE_URL,
		},
		contactPoint: [
			{
				"@type": "ContactPoint",
				contactType: "sales",
				email: businessProfile.email,
				telephone: businessProfile.telephone,
				url: businessProfile.contactPage,
				areaServed: "US",
				availableLanguage: ["en-US"],
			},
		],
		hasMap: GOOGLE_BUSINESS_PROFILE_URL,
		knowsAbout: businessProfile.knowsAbout,
		sameAs: businessProfile.sameAs,
		owns: {
			"@id": AGENCY_OS_SOFTWARE_ID,
		},
		hasOfferCatalog: buildCoreServiceOfferCatalog(),
	};
}

export function buildBaseWebsiteSchema(): SchemaValue {
	const contactUrl = toAbsoluteUrl("/contact");
	const auditUrl = toAbsoluteUrl("/free-seo-audit");
	const calendlyBook =
		"https://calendly.com/anthony-designedbyanthony/web-design-consult";

	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		url: SITE_URL,
		name: SITE_NAME,
		alternateName: businessProfile.alternateName,
		description: businessProfile.description,
		publisher: {
			"@id": ORGANIZATION_ID,
		},
		about: {
			"@id": ORGANIZATION_ID,
		},
		image: buildOwnedImageObject(DEFAULT_SOCIAL_IMAGE),
		copyrightHolder: {
			"@id": ORGANIZATION_ID,
		},
		inLanguage: "en-US",
		/** Machine-readable primary actions — aligns with Google rich result / entity understanding. */
		potentialAction: [
			{
				"@type": "ViewAction",
				name: "Run free Lighthouse-style website audit",
				target: {
					"@type": "EntryPoint",
					urlTemplate: auditUrl,
				},
			},
			{
				"@type": "ContactAction",
				name: "Contact Designed by Anthony",
				target: {
					"@type": "EntryPoint",
					urlTemplate: contactUrl,
				},
			},
			{
				"@type": "ViewAction",
				name: "Book a free web design consultation",
				target: {
					"@type": "EntryPoint",
					urlTemplate: calendlyBook,
				},
			},
		],
	};
}

/**
 * Agency OS — CRM, client portal, and automation roadmap (Growth Plan).
 * Distinct from the free Lighthouse audit tool; linked from global JSON-LD on every page.
 */
export function buildAgencyOsSoftwareApplicationSchema(): SchemaValue {
	const monthlyNumeric = FOUNDING_PARTNER_SEO_MONTHLY.replace(/[^0-9.]/g, "");

	return {
		"@context": "https://schema.org",
		"@type": ["SoftwareApplication", "WebApplication"],
		"@id": AGENCY_OS_SOFTWARE_ID,
		name: "Agency OS",
		alternateName: "Designed by Anthony Agency OS",
		description:
			"CRM for service businesses: pipeline and leads, client portal (magic-link access), and automations — paired with hosting and local SEO on the Growth Plan. Admin at admin.vertaflow.io; client-facing tools via accounts.vertaflow.io.",
		applicationCategory: "BusinessApplication",
		applicationSubCategory: "CRM",
		operatingSystem: "Web",
		url: AGENCY_OS_APP_URL,
		image: buildOwnedImageObject(DEFAULT_SOCIAL_IMAGE),
		offers: {
			"@type": "Offer",
			name: "Growth Plan (founding partners)",
			description:
				"Bundled with founding-partner website builds: hosting, security, SEO, and Agency OS access.",
			price: monthlyNumeric,
			priceCurrency: "USD",
			priceValidUntil: `${new Date().getFullYear()}-12-31`,
			availability: "https://schema.org/InStock",
			url: toAbsoluteUrl("/pricing"),
		},
		featureList: [
			"Lead and pipeline tracking",
			"Client portal",
			"Magic-link sign-in",
			"Automations (roadmap)",
			"Paired with hosting and local SEO",
		],
		creator: {
			"@id": ORGANIZATION_ID,
		},
		publisher: {
			"@id": ORGANIZATION_ID,
		},
		maintainer: {
			"@id": ORGANIZATION_ID,
		},
		inLanguage: "en-US",
	};
}

/** OfferCatalog for /pricing — monthly stacks + CRM tiers (list prices). */
export function buildPricingOfferCatalogSchema(): SchemaValue {
	const pricingUrl = toAbsoluteUrl("/pricing");
	const captureNum = AGENCY_OS_CAPTURE_MONTHLY.replace(/[^0-9.]/g, "");
	const suiteNum = AGENCY_OS_SUITE_MONTHLY.replace(/[^0-9.]/g, "");
	const growthNum = FOUNDING_PARTNER_SEO_MONTHLY.replace(/[^0-9.]/g, "");
	const gbpNum = GBP_FULL_PROGRAM_MONTHLY_PRICE.replace(/[^0-9.]/g, "");

	return {
		"@context": "https://schema.org",
		"@type": "OfferCatalog",
		"@id": `${pricingUrl}#offercatalog`,
		name: "Designed by Anthony — Pricing",
		url: pricingUrl,
		description:
			"Website projects, Agency OS CRM tiers, Growth Plan bundle, and Google Business Profile program.",
		itemListElement: [
			{
				"@type": "Offer",
				name: `Custom website (typical range)`,
				description: `Most service-business rebuilds land in the ${STANDARD_WEBSITE_TYPICAL_RANGE} range; simple sites from ${STANDARD_WEBSITE_STARTING_PRICE}.`,
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: `Agency OS ${AGENCY_OS_CAPTURE_LABEL}`,
				description:
					"Website leads, scheduling, and pipeline basics — CRM software.",
				price: captureNum,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: `Agency OS ${AGENCY_OS_SUITE_LABEL}`,
				description:
					"Full Agency OS: client portal, automations roadmap, and full CRM scope.",
				price: suiteNum,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: "Growth Plan",
				description:
					"Hosting, security, local SEO, and Agency OS Suite — bundled for website clients.",
				price: growthNum,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: "Google Business Profile program",
				description: "Full local marketing program per location.",
				price: gbpNum,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: pricingUrl,
			},
		],
	};
}

/**
 * SoftwareApplication schema for the Lighthouse audit tool.
 * Emit on `/free-seo-audit` and the homepage so Google/Bing understand
 * the free tool as a distinct product entity offered by the organization.
 */
export function buildLighthouseSoftwareApplicationSchema(): SchemaValue {
	const url = toAbsoluteUrl("/free-seo-audit");

	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"@id": `${url}#software`,
		name: "Designed by Anthony — Free Lighthouse Audit",
		description:
			"Free in-house Lighthouse audit tool for service-business websites. Returns Google Core Web Vitals, accessibility, best-practices, and SEO scores in under 60 seconds with a written breakdown of practical fixes.",
		applicationCategory: "BusinessApplication",
		applicationSubCategory: "WebPerformance",
		operatingSystem: "Web",
		url,
		image: buildOwnedImageObject(DEFAULT_SOCIAL_IMAGE),
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			availability: "https://schema.org/InStock",
			url,
		},
		featureList: [
			"Google Lighthouse performance score",
			"Accessibility score",
			"Best-practices score",
			"SEO score",
			"Core Web Vitals (LCP / CLS / TBT) metrics",
			"Mobile-first audit",
			"Plain-language writeup of issues",
		],
		creator: {
			"@id": ORGANIZATION_ID,
		},
		publisher: {
			"@id": ORGANIZATION_ID,
		},
		inLanguage: "en-US",
		isAccessibleForFree: true,
	};
}

export function buildFounderPersonSchema(): SchemaValue {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		"@id": PERSON_ID,
		name: businessProfile.founderName,
		description: businessProfile.founderDescription,
		jobTitle: businessProfile.founderJobTitle,
		url: toAbsoluteUrl("/about"),
		image: buildOwnedImageObject("/images/about_cover.png"),
		worksFor: {
			"@id": ORGANIZATION_ID,
		},
		homeLocation: toPlace(businessProfile.homeBase),
		knowsAbout: businessProfile.knowsAbout,
	};
}
