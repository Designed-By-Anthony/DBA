import {
	BRAND_ASSETS,
	BRAND_NAME,
	BRAND_SITE_URL,
} from "@/design-system/brand";

export type SiteLink = {
	href: string;
	label: string;
};

export const SITE_WORDMARK_ALT = "ANTHONY. | Digital Infrastructure Architect";

export const SITE_BRAND = {
	name: BRAND_NAME,
	url: BRAND_SITE_URL,
	homeHref: "/",
	tagline: "Mohawk Valley · 315 / 518 · Central NY",
	footerDescription: "Custom websites for Central NY service businesses.",
	assets: BRAND_ASSETS,
	/** Display wordmark without trailing period where punctuation is duplicated (e.g. © line). */
	displayNameShort: "ANTHONY",
} as const;

export const SITE_BANNER = {
	href: "/lighthouse",
	label: "The 315 Pilot: 10 Founding Infrastructure Placements Remaining",
	cta: "start with a free SEO + performance audit",
	currentCta: "You're already on the free audit ↓",
} as const;

export const SITE_HEADER_NAV_LINKS = [
	{ href: "/ouredge", label: "Our Edge" },
	{ href: "/services", label: "Services" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "/pricing", label: "Pricing" },
	{ href: "/service-areas", label: "Service Areas" },
	{ href: "/about", label: "About" },
	{ href: "/faq", label: "FAQ" },
	{ href: "/blog", label: "Blog" },
	{ href: "/tools", label: "Tools" },
] as const satisfies readonly SiteLink[];

export const SITE_CONTACT_LINK = {
	href: "/contact",
	label: "Contact",
} as const satisfies SiteLink;

export const SITE_AUDIT_CTA = {
	href: "/lighthouse",
	label: "Audit My Site",
	shortLabel: "Audit My Site",
} as const;

export const SITE_FOOTER_LINKS = [
	{ href: "/services", label: "Services" },
	{ href: "/pricing", label: "Pricing" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "/tools", label: "Tools" },
	{ href: "/blog", label: "Blog" },
	{ href: "/contact", label: "Contact" },
] as const satisfies readonly SiteLink[];

export const SITE_LEGAL_LINKS = [
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
	{ href: "/cookie", label: "Cookies" },
] as const satisfies readonly SiteLink[];

export const SITE_SOCIAL_LINKS = [
	{ href: "https://share.google/c4NOQf9hkRWAN32rO", label: "Google" },
	{
		href: "https://www.facebook.com/profile.php?id=61574388797744",
		label: "Facebook",
	},
	{ href: "https://www.instagram.com/dbastudio315/", label: "Instagram" },
] as const satisfies readonly SiteLink[];

export function absoluteSiteUrl(path: string): string {
	const cleanPath = path.startsWith("/") ? path : `/${path}`;
	return `${SITE_BRAND.url}${cleanPath}`;
}
