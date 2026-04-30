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
		<header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(6,10,18,0.88)] backdrop-blur-xl">
			<aside className="border-b border-[rgb(var(--accent-bronze-rgb)/0.18)] bg-[rgba(10,14,22,0.92)]">
				<div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-[rgb(var(--accent-bronze-rgb)/0.88)] sm:px-6 lg:px-8">
					<Link
						href={isAudit ? SITE_BRAND.homeHref : SITE_BANNER.href}
						className="inline-flex items-center gap-2 text-current transition hover:text-white"
					>
						<span className="size-2 rounded-full bg-[rgb(var(--accent-bronze-rgb))] shadow-[0_0_12px_rgba(201,168,108,0.45)]" />
						<span>
							<strong className="font-semibold text-[var(--accent-bronze-light)]">
								{SITE_BANNER.label}
							</strong>{" "}
							<span className="hidden sm:inline">
								{isAudit ? SITE_BANNER.currentCta : `${SITE_BANNER.cta} →`}
							</span>
						</span>
					</Link>
				</div>
			</aside>
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
				<Link
					href={SITE_BRAND.homeHref}
					className="flex min-w-0 items-center gap-3"
					aria-label={`${SITE_BRAND.name} — home`}
				>
					<Image
						src={SITE_BRAND.assets.mark}
						alt="Designed by Anthony logo"
						width={40}
						height={30}
						priority
						style={{ width: "auto" }}
					/>
					<span className="min-w-0">
						<span className="block truncate font-[var(--font-report-display)] text-lg font-semibold tracking-[-0.02em] text-white">
							{SITE_BRAND.name}
						</span>
						<span className="hidden text-[11px] uppercase tracking-[0.18em] text-white/55 sm:block">
							{SITE_BRAND.tagline}
						</span>
					</span>
				</Link>

				<nav
					className="hidden items-center gap-6 md:flex"
					aria-label="Designed by Anthony main navigation"
				>
					{SITE_HEADER_NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="text-sm font-medium text-white/72 transition hover:text-white"
						>
							{link.label}
						</Link>
					))}
					<Link
						href={SITE_CONTACT_LINK.href}
						className="text-sm font-medium text-white/72 transition hover:text-white"
					>
						{SITE_CONTACT_LINK.label}
					</Link>
					{isAudit ? (
						<span className="inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
							<span className="size-2 rounded-full bg-emerald-400" />
							{SITE_AUDIT_CTA.shortLabel}
						</span>
					) : (
						<Link
							href={SITE_AUDIT_CTA.href}
							className="inline-flex items-center rounded-full border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-200/50 hover:bg-sky-500/25"
						>
							{SITE_AUDIT_CTA.label}
						</Link>
					)}
				</nav>

				<div className="flex items-center gap-2 md:hidden">
					{isAudit ? (
						<span className="inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
							<span className="size-2 rounded-full bg-emerald-400" />
							{SITE_AUDIT_CTA.shortLabel}
						</span>
					) : (
						<Link
							href={SITE_AUDIT_CTA.href}
							className="inline-flex items-center rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
						>
							{SITE_AUDIT_CTA.shortLabel}
						</Link>
					)}
					{includeHamburger ? (
						<button
							type="button"
							data-mobile-nav-toggle
							className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
							aria-label="Open navigation menu"
							aria-controls="mobile-nav"
							aria-expanded="false"
						>
							<span className="flex flex-col gap-1.5">
								<span className="block h-0.5 w-5 rounded-full bg-current" />
								<span className="block h-0.5 w-5 rounded-full bg-current" />
								<span className="block h-0.5 w-5 rounded-full bg-current" />
							</span>
						</button>
					) : null}
				</div>
			</div>
		</header>
	);
}
