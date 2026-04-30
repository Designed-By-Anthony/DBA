import Image from "next/image";
import Link from "next/link";
import {
	SITE_AUDIT_CTA,
	SITE_BANNER,
	SITE_BRAND,
	SITE_CONTACT_LINK,
	SITE_HEADER_NAV_LINKS,
} from "@/design-system/site-config";

export type BrandHeaderProps = {
	currentSection?: "audit";
	includeHamburger?: boolean;
};

export function BrandHeader({
	currentSection,
	includeHamburger = true,
}: BrandHeaderProps) {
	const isAudit = currentSection === "audit";

	return (
		<header className="dba-header">
			<Link
				href={isAudit ? SITE_BRAND.homeHref : SITE_BANNER.href}
				className="dba-banner"
			>
				<span className="dba-banner-dot" aria-hidden="true" />
				<span>{SITE_BANNER.label}</span>
				<strong>{isAudit ? SITE_BANNER.currentCta : SITE_BANNER.cta}</strong>
			</Link>

			<div className="dba-header-inner">
				<Link
					href={SITE_BRAND.homeHref}
					className="dba-brand-lockup"
					aria-label={`${SITE_BRAND.name} home`}
				>
					<Image
						src={SITE_BRAND.assets.mark}
						alt=""
						width={40}
						height={30}
						className="dba-brand-mark"
						priority
					/>
					<span className="dba-brand-wordmark">
						<span>{SITE_BRAND.name}</span>
						<small>{SITE_BRAND.tagline}</small>
					</span>
				</Link>

				<nav className="dba-nav dba-nav--desktop" aria-label="Main navigation">
					{SITE_HEADER_NAV_LINKS.map((link) => (
						<Link key={link.href} href={link.href} className="dba-nav-link">
							{link.label}
						</Link>
					))}
					<Link href={SITE_CONTACT_LINK.href} className="dba-nav-link">
						{SITE_CONTACT_LINK.label}
					</Link>
					{isAudit ? (
						<span className="dba-nav-current" aria-current="page">
							{SITE_AUDIT_CTA.shortLabel}
						</span>
					) : (
						<Link href={SITE_AUDIT_CTA.href} className="dba-nav-cta">
							{SITE_AUDIT_CTA.label}
						</Link>
					)}
				</nav>

				<div className="dba-nav dba-nav--mobile">
					<Link href={SITE_AUDIT_CTA.href} className="dba-nav-cta">
						{isAudit ? "Scanner" : SITE_AUDIT_CTA.shortLabel}
					</Link>
					{includeHamburger ? (
						<button
							className="hamburger dba-hamburger"
							id="hamburger-btn"
							type="button"
							aria-label="Open navigation menu"
							aria-controls="mobile-nav"
							aria-expanded="false"
						>
							<span className="hamburger-line" />
							<span className="hamburger-line" />
							<span className="hamburger-line" />
						</button>
					) : null}
				</div>
			</div>
		</header>
	);
}
