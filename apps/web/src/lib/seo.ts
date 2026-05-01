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

import { serviceAreaSlugLabels } from "@/data/serviceAreaLocations";
import { BRAND_ASSETS } from "@/design-system/brand";
import {
	CRM_ADMIN_APP_URL,
	CRM_CAPTURE_MONTHLY,
	CRM_CAPTURE_TIER_LABEL,
	CRM_SUITE_MONTHLY,
	CRM_SUITE_TIER_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	GBP_FULL_PROGRAM_MONTHLY_PRICE,
	PUBLIC_LAUNCH_BUNDLE_MONTHS,
	STANDARD_WEBSITE_INSTALLMENT_EACH,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "./offers";

export const SITE_URL = "https://designedbyanthony.com";
export const SITE_NAME = "ANTHONY.";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/about#person`;
/** Stable JSON-LD @id for The Vault (CRM console) — admin app origin. */
export const VAULT_CRM_SOFTWARE_ID = `${CRM_ADMIN_APP_URL}/#software`;
export const GA_MEASUREMENT_ID = "G-4RSTBMRHDW";
export const GOOGLE_BUSINESS_PROFILE_URL =
	"https://www.google.com/search?kgmid=/g/11z36l4fmd&q=Designed+By+Anthony";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/images/og-site-premium.png`;
export const SITE_LICENSE_PAGE = `${SITE_URL}/image-license`;
export const SITE_COPYRIGHT = `© ${new Date().getFullYear()} ${SITE_NAME} All rights reserved.`;
export const FACEBOOK_PROFILE_URL =
	"https://www.facebook.com/profile.php?id=61574388797744";
export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/dbastudio315/";
export const YELP_BUSINESS_URL =
	"https://www.yelp.com/biz/designed-by-anthony-rome-2";

/** Richer org description for JSON-LD (Organization / ProfessionalService / LocalBusiness). */
export const ORGANIZATION_SCHEMA_DESCRIPTION =
	"ANTHONY. engineers bespoke digital estates and high-performance infrastructure for service businesses — The Vault CRM (client workspace and automations), managed hosting, and local SEO across the Mohawk Valley (315), Capital Region (518), and Central New York. Digital Infrastructure, Engineered in the Copper City (Rome, NY).";

export const businessProfile = {
	name: SITE_NAME,
	alternateName: ["designedbyanthony.com", "ANTHONY"],
	legalName: SITE_NAME,
	url: SITE_URL,
	contactPage: `${SITE_URL}/contact`,
	email: "anthony@designedbyanthony.com",
	telephone: "+1-315-922-5592",
	telephoneHref: "tel:+13159225592",
	founderName: "Anthony Jones",
	founderJobTitle: "Founder, Web Designer, and Developer",
	founderDescription:
		"Marine Corps veteran and founder of ANTHONY., building custom websites, The Vault CRM (client workspace, automations), managed hosting, website rescues, and local SEO systems for service businesses from Rome, NY.",
	description:
		"ANTHONY. builds custom websites, The Vault CRM (client workspace, automations), website rescues, managed hosting, and local SEO systems for service businesses across the Mohawk Valley, Capital Region, and Central New York.",
	logo: `${SITE_URL}${BRAND_ASSETS.masterWordmark}`,
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
		"Saratoga Springs, New York",
		"Albany, New York",
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
		"Mohawk Valley New York",
		"Capital Region New York",
		"Central New York",
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

/** Public service pages under `/services/*` — used by JSON-LD and the marketing catch-all router. */
export const MARKETING_SERVICES = [
	{
		name: "Custom Web Design",
		path: "/services/custom-web-design",
		description:
			"Strategic website design combining brand aesthetics with conversion-focused architecture. Engineered for performance, built for results.",
	},
	{
		name: "Website Recovery & Performance",
		path: "/services/website-rescue",
		description:
			"Comprehensive site remediation addressing technical debt, mobile experience, and conversion optimization. Restore performance, reclaim rankings.",
	},
	{
		name: "Enterprise Hosting & Support",
		path: "/services/managed-hosting",
		description:
			"Premium managed infrastructure on Cloudflare's edge network with dedicated technical support. Enterprise-grade security, global performance, zero maintenance overhead.",
	},
	{
		name: "Local SEO & Search Strategy",
		path: "/services/local-seo",
		description:
			"Data-driven local search optimization and Google Business Profile management. Strategic entity alignment for service-area businesses seeking market dominance.",
	},
	{
		name: "Local Marketing Intelligence",
		path: "/services/google-business-profile",
		description:
			"Comprehensive local presence management integrating reputation systems, citation networks, and AI-powered visibility optimization. Full-funnel reporting included.",
	},
	{
		name: "Business Systems Integration",
		path: "/services/workspace-setup",
		description:
			"Enterprise workspace architecture and business system integration. Seamless email, collaboration, and workflow automation deployment.",
	},
	{
		name: "Micro SaaS Development",
		path: "/services/micro-saas",
		description:
			"Bespoke web applications and marketing automation systems for scaling businesses. From custom CRMs to lead generation platforms — engineered for growth.",
	},
] as const;

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
	...serviceAreaSlugLabels,
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
	return title.replace(/\s*\|\s*ANTHONY\.\s*$/i, "").trim();
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
	return MARKETING_SERVICES.map((service) => {
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

/** WebPage JSON-LD for marketing landing pages (paired with breadcrumb list). */
export function buildMarketingWebPageSchema(input: {
	pathname: string;
	name: string;
	description: string;
}): SchemaValue {
	const url = toAbsoluteUrl(input.pathname);

	return {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${url}#webpage`,
		url,
		name: input.name,
		description: input.description,
		isPartOf: {
			"@id": WEBSITE_ID,
		},
		inLanguage: "en-US",
		publisher: {
			"@id": ORGANIZATION_ID,
		},
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

export function buildFaqPageSchema(
	entries: FaqEntry[],
	options?: { path?: string },
): SchemaValue {
	const path = options?.path ?? "/";
	const faqId = `${toAbsoluteUrl(path)}#faqpage`;

	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"@id": faqId,
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
		 * Primary service footprint: GeoCircle covering Mohawk Valley (315),
		 * Capital Region (518), and Central NY (~150 mi / ~241 km from Rome HQ).
		 */
		serviceArea: [
			{
				"@type": "GeoCircle",
				geoMidpoint: {
					"@type": "GeoCoordinates",
					latitude: businessProfile.geo.latitude,
					longitude: businessProfile.geo.longitude,
				},
				geoRadius: "241401",
				description:
					"~150-mile radius from engineering HQ (7749 Kilbourn Rd, Rome, NY 13440) covering Mohawk Valley (315), Capital Region (518), and Central New York.",
			},
			...businessProfile.areaServed.map(toPlace),
		],
		slogan: "Digital Infrastructure, Engineered in the Copper City.",
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
			"@id": VAULT_CRM_SOFTWARE_ID,
		},
		hasOfferCatalog: buildCoreServiceOfferCatalog(),
	};
}

export function buildBaseWebsiteSchema(): SchemaValue {
	const contactUrl = toAbsoluteUrl("/contact");
	const auditUrl = toAbsoluteUrl("/lighthouse");

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
				"@type": "ContactAction",
				name: "Contact ANTHONY.",
				target: {
					"@type": "EntryPoint",
					urlTemplate: contactUrl,
				},
			},
			{
				"@type": "ViewAction",
				name: "Run a free site audit",
				target: {
					"@type": "EntryPoint",
					urlTemplate: auditUrl,
				},
			},
		],
	};
}

/**
 * The Vault — client workspace, pipeline, and automation roadmap (Growth Plan).
 * Distinct from the free Lighthouse audit tool; linked from global JSON-LD on every page.
 */
export function buildVaultCrmSoftwareApplicationSchema(): SchemaValue {
	const monthlyNumeric = FOUNDING_PARTNER_SEO_MONTHLY.replace(/[^0-9.]/g, "");

	return {
		"@context": "https://schema.org",
		"@type": ["SoftwareApplication", "WebApplication"],
		"@id": VAULT_CRM_SOFTWARE_ID,
		name: "The Vault by ANTHONY.",
		alternateName: [
			"ANTHONY. Vault — Client Workspace",
			"ANTHONY_INFRASTRUCTURE",
		],
		description:
			"CRM for service businesses: pipeline and leads, client portal (magic-link access), and automations — paired with hosting and local SEO on the Growth Plan. Console access via the managed admin host; client-facing tools via accounts.designedbyanthony.com.",
		applicationCategory: "BusinessApplication",
		applicationSubCategory: "CRM",
		operatingSystem: "Web",
		url: CRM_ADMIN_APP_URL,
		image: buildOwnedImageObject(DEFAULT_SOCIAL_IMAGE),
		offers: {
			"@type": "Offer",
			name: "Growth Plan (founding partners)",
			description:
				"Bundled with founding-partner website builds: hosting, security, SEO, and The Vault client workspace access.",
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
	const captureNum = CRM_CAPTURE_MONTHLY.replace(/[^0-9.]/g, "");
	const suiteNum = CRM_SUITE_MONTHLY.replace(/[^0-9.]/g, "");
	const growthNum = FOUNDING_PARTNER_SEO_MONTHLY.replace(/[^0-9.]/g, "");
	const gbpNum = GBP_FULL_PROGRAM_MONTHLY_PRICE.replace(/[^0-9.]/g, "");

	return {
		"@context": "https://schema.org",
		"@type": "OfferCatalog",
		"@id": `${pricingUrl}#offercatalog`,
		name: "ANTHONY. — Pricing",
		url: pricingUrl,
		description:
			"Website projects, Vault CRM tiers, Growth Plan bundle, and Google Business Profile program.",
		itemListElement: [
			{
				"@type": "Offer",
				name: `Custom website (typical range)`,
				description: `Standard rebuilds: three equal payments of ${STANDARD_WEBSITE_INSTALLMENT_EACH} at launch (typical total ${STANDARD_WEBSITE_TYPICAL_RANGE}) with ${PUBLIC_LAUNCH_BUNDLE_MONTHS} months of hosting and core local SEO included, then optional ${FOUNDING_PARTNER_SEO_MONTHLY}/mo Growth Plan; simple sites from ${STANDARD_WEBSITE_STARTING_PRICE}.`,
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: `Vault ${CRM_CAPTURE_TIER_LABEL}`,
				description:
					"Website leads, scheduling, and pipeline basics — CRM software.",
				price: captureNum,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: `Vault ${CRM_SUITE_TIER_LABEL}`,
				description:
					"Full Vault Suite: client portal, automations roadmap, and full CRM scope.",
				price: suiteNum,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				url: pricingUrl,
			},
			{
				"@type": "Offer",
				name: "Growth Plan",
				description:
					"Hosting, security, local SEO, and Vault Suite — bundled for website clients.",
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

/**
 * SiteNavigationElement — signals to Google which pages are primary nav targets.
 * This is the strongest structured-data hint for earning sitelinks in SERPs.
 * Order matters: list pages in the priority you'd want them shown.
 */
export function buildSiteNavigationSchema(): SchemaValue {
	const navItems = [
		{ name: "Services", path: "/services" },

		{ name: "Pricing", path: "/pricing" },
		{ name: "Portfolio", path: "/portfolio" },
		{ name: "Blog", path: "/blog" },
		{ name: "About", path: "/about" },
		{ name: "Our Edge", path: "/ouredge" },
		{ name: "Contact", path: "/contact" },
	];

	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		"@id": `${SITE_URL}#site-navigation`,
		name: "Main Navigation",
		itemListElement: navItems.map((item, index) => ({
			"@type": "SiteNavigationElement",
			position: index + 1,
			name: item.name,
			url: toAbsoluteUrl(item.path),
		})),
	};
}
