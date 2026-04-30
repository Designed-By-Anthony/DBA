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
	/** When set to "audit", the header shows a current-page chip
	 * instead of the "Audit My Site" CTA. */
	currentSection?: "audit";
	/**
	 * Render a hamburger button that the existing mobile-nav-overlay JS
	 * (in public/scripts/site.js) hooks into. The lighthouse page can pass
	 * `false` to render a slim mobile slot instead.
	 */
	includeHamburger?: boolean;
};

export function BrandHeader({
	currentSection,
	includeHamburger = true,
}: BrandHeaderProps) {
	const isAudit = currentSection === "audit";

	return (
		<>
			{/* ── Top banner ── */}
			<aside className="dba-banner" aria-label="Site notice">
				<Link
					href={isAudit ? SITE_BRAND.homeHref : SITE_BANNER.href}
					className="dba-banner-link"
				>
					<span className="dba-banner-dot" aria-hidden />
					<span className="dba-banner-text">
						<strong>{SITE_BANNER.label}</strong>
						<span className="dba-banner-sep" aria-hidden>
							{" — "}
						</span>
						<span className="dba-banner-cta">
							{isAudit ? SITE_BANNER.currentCta : `${SITE_BANNER.cta} →`}
						</span>
					</span>
				</Link>
			</aside>

			{/* ── Header ── */}
			<header className="dba-header">
				<div className="dba-header-inner mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 md:gap-6 lg:px-8">
					<Link
						href={SITE_BRAND.homeHref}
						className="dba-brand-lockup min-w-0 shrink"
						aria-label={`${SITE_BRAND.name} — home`}
					>
						<Image
							src={SITE_BRAND.assets.mark}
							alt="Designed by Anthony logo"
							width={36}
							height={27}
							className="dba-brand-mark"
							style={{ width: "auto" }}
							priority
						/>
						<span className="dba-brand-wordmark">
							<span className="dba-brand-wordmark-display">
								{SITE_BRAND.name}
							</span>
							<span className="dba-brand-wordmark-sub">
								{SITE_BRAND.tagline}
							</span>
						</span>
					</Link>

					<nav
						className="dba-nav dba-nav--desktop hidden md:!ml-auto md:!flex md:items-center md:gap-6"
						aria-label="Designed by Anthony main navigation"
					>
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
								<span className="dba-nav-current-dot" aria-hidden />
								{SITE_AUDIT_CTA.shortLabel}
							</span>
						) : (
							<Link
								href={SITE_AUDIT_CTA.href}
								className="dba-nav-cta"
								id="nav-audit-btn"
							>
								{SITE_AUDIT_CTA.label}
							</Link>
						)}
					</nav>

					{/* Mobile slot — either hamburger (marketing site) or current chip (lighthouse) */}
					<div className="dba-nav dba-nav--mobile flex items-center gap-3 md:!hidden">
						{isAudit ? (
							<span className="dba-nav-current" aria-current="page">
								<span className="dba-nav-current-dot" aria-hidden />
								{SITE_AUDIT_CTA.shortLabel}
							</span>
						) : (
							<Link
								href={SITE_AUDIT_CTA.href}
								className="dba-nav-cta dba-nav-cta--compact"
							>
								{SITE_AUDIT_CTA.shortLabel}
							</Link>
						)}
						{includeHamburger ? (
							<button
								className="hamburger dba-hamburger inline-flex h-11 w-11 items-center justify-center"
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
				{/* Brass accent rule under header */}
				<div className="dba-header-rule" aria-hidden />
			</header>
		</>
	);
}
