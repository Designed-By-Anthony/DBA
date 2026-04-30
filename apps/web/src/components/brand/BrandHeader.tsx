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
				<div className="dba-header-inner">
					<Link
						href={SITE_BRAND.homeHref}
						className="dba-brand-lockup"
						aria-label={`${SITE_BRAND.name} — home`}
					>
						<Image
							src={SITE_BRAND.assets.mark}
							alt=""
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
						className="dba-nav dba-nav--desktop"
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
					<div className="dba-nav dba-nav--mobile">
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
				{/* Brass accent rule under header */}
				<div className="dba-header-rule" aria-hidden />
			</header>
		</>
	);
}
