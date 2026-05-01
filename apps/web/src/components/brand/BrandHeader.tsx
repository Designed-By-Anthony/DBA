import Link from "next/link";
import {
	SITE_AUDIT_CTA,
	SITE_BANNER,
	SITE_BRAND,
	SITE_CONTACT_LINK,
	SITE_HEADER_NAV_LINKS,
	SITE_WORDMARK_ALT,
} from "@/design-system/site-config";

export type BrandHeaderProps = {
	currentSection?: "audit";
	includeHamburger?: boolean;
};

const navAuditCtaTypography =
	"font-[family-name:var(--font-inter)] font-semibold uppercase tracking-widest text-[0.68rem]";

const navCtaBase = `inline-flex items-center gap-[0.4rem] rounded-[0.6rem] border border-[rgba(212,175,55,0.45)] bg-[linear-gradient(170deg,rgba(212,175,55,0.22)_0%,rgba(181,138,20,0.32)_100%)] ${navAuditCtaTypography} text-[rgba(252,240,210,0.96)] no-underline shadow-[0_8px_22px_-10px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[transform,box-shadow,border-color] duration-[200ms] ease-in whitespace-nowrap hover:-translate-y-px hover:border-[rgba(212,175,55,0.65)] hover:shadow-[0_12px_28px_-10px_rgba(212,175,55,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]`;

const auditCurrentChip = `inline-flex items-center gap-[0.45rem] px-3 py-[0.35rem] rounded-full border border-[rgba(56,189,248,0.32)] bg-[rgba(56,189,248,0.08)] ${navAuditCtaTypography} text-[rgba(186,230,253,0.95)] whitespace-nowrap`;

const bannerDotBronze =
	"inline-block w-[0.4rem] h-[0.4rem] rounded-full shrink-0 bg-[rgb(var(--accent-bronze-rgb))] animate-[atelier-bronze-dot-pulse_2.4s_ease-in-out_infinite]";

export function BrandHeader({
	currentSection,
	includeHamburger = true,
}: BrandHeaderProps) {
	const isAudit = currentSection === "audit";

	return (
		<>
			<aside
				className="relative z-[4] bg-[linear-gradient(90deg,rgba(8,12,22,0.96)_0%,rgba(11,17,30,0.96)_50%,rgba(8,12,22,0.96)_100%)] border-b border-[rgba(212,175,55,0.14)]"
				aria-label="Site notice"
			>
				<Link
					href={isAudit ? SITE_BRAND.homeHref : SITE_BANNER.href}
					className="site-banner-link flex items-center justify-center gap-[0.6rem] px-4 py-[0.55rem] text-[0.7rem] font-[family-name:var(--font-inter)] font-light tracking-[0.03em] text-[rgba(232,213,168,0.88)] no-underline transition-colors duration-[180ms] ease-in hover:text-[rgba(252,240,210,1)] max-[36rem]:text-[0.65rem] max-[36rem]:px-3 max-[36rem]:py-[0.5rem]"
				>
					<span className={bannerDotBronze} aria-hidden />
					<span>
						<span className="text-[rgba(252,240,210,0.94)]">
							{SITE_BANNER.label}
						</span>
						<span
							className="text-[rgba(232,213,168,0.4)] mx-[0.05em]"
							aria-hidden
						>
							{" — "}
						</span>
						<span className="italic text-[rgba(232,213,168,0.65)] max-[36rem]:hidden">
							{isAudit ? SITE_BANNER.currentCta : `${SITE_BANNER.cta} →`}
						</span>
					</span>
				</Link>
			</aside>

			<header className="relative z-[3] bg-[#0a0c10]/80 backdrop-blur-md border-b border-white/10 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
				<div className="flex items-center justify-between gap-6 max-w-[80rem] mx-auto pt-8 pb-4">
					<Link
						href={SITE_BRAND.homeHref}
						className="inline-flex items-center min-w-0 shrink max-w-[min(72vw,14rem)] md:max-w-none group"
						aria-label={SITE_WORDMARK_ALT}
					>
						{/* biome-ignore lint/performance/noImgElement: Direct SVG wordmark keeps the bronze period locked to the master asset. */}
						<img
							src="/logos/anthony_master_wordmark.svg"
							alt="ANTHONY."
							className="block h-8 w-auto opacity-[0.96] transition-opacity duration-200 group-hover:opacity-100"
						/>
					</Link>

					<nav
						className="hidden min-[960px]:flex items-center gap-5"
						aria-label="Main navigation"
					>
						{SITE_HEADER_NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-[0.82rem] font-medium text-[rgba(247,244,238,0.7)] no-underline transition-colors duration-[180ms] ease-in tracking-[-0.005em] whitespace-nowrap hover:text-[rgba(247,244,238,0.98)]"
							>
								{link.label}
							</Link>
						))}
						<Link
							href={SITE_CONTACT_LINK.href}
							className="nav-contact-link text-[0.82rem] font-medium text-[rgba(247,244,238,0.7)] no-underline transition-colors duration-[180ms] ease-in tracking-[-0.005em] whitespace-nowrap hover:text-[rgba(247,244,238,0.98)]"
						>
							{SITE_CONTACT_LINK.label}
						</Link>
						{isAudit ? (
							<span className={auditCurrentChip} aria-current="page">
								<span
									className="inline-block w-[0.35rem] h-[0.35rem] rounded-full bg-[rgb(74,222,128)] shadow-[0_0_6px_1px_rgba(74,222,128,0.55)] animate-[dba-pulse-dot_2s_ease-in-out_infinite]"
									aria-hidden
								/>
								{SITE_AUDIT_CTA.shortLabel}
							</span>
						) : (
							<Link
								href={SITE_AUDIT_CTA.href}
								className={`${navCtaBase} px-[1rem] py-[0.5rem]`}
								id="nav-audit-btn"
							>
								{SITE_AUDIT_CTA.shortLabel}
							</Link>
						)}
					</nav>

					<div className="flex min-[960px]:hidden items-center gap-[0.6rem]">
						{isAudit ? (
							<span className={auditCurrentChip} aria-current="page">
								<span
									className="inline-block w-[0.35rem] h-[0.35rem] rounded-full bg-[rgb(74,222,128)] shadow-[0_0_6px_1px_rgba(74,222,128,0.55)] animate-[dba-pulse-dot_2s_ease-in-out_infinite]"
									aria-hidden
								/>
								{SITE_AUDIT_CTA.shortLabel}
							</span>
						) : (
							<Link
								href={SITE_AUDIT_CTA.href}
								className={`${navCtaBase} px-[0.75rem] py-[0.38rem]`}
							>
								{SITE_AUDIT_CTA.shortLabel}
							</Link>
						)}
						{includeHamburger ? (
							<button
								className="hamburger inline-flex flex-col justify-center gap-[0.28rem] w-[2.4rem] h-[2.4rem] px-[0.55rem] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-[0.5rem] cursor-pointer transition-[background,border-color] duration-[180ms] ease-in hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] aria-expanded:bg-[rgba(255,255,255,0.08)] aria-expanded:border-[rgba(255,255,255,0.18)] [&.active>span:nth-child(1)]:[transform:translate(0,0.4rem)_rotate(45deg)] [&.active>span:nth-child(2)]:opacity-0 [&.active>span:nth-child(3)]:[transform:translate(0,-0.4rem)_rotate(-45deg)]"
								id="hamburger-btn"
								type="button"
								aria-label="Open navigation menu"
								aria-controls="mobile-nav"
								aria-expanded="false"
							>
								<span className="block h-[1.5px] w-full bg-[rgba(247,244,238,0.78)] rounded-[1px] transition-transform duration-[200ms] ease-in" />
								<span className="block h-[1.5px] w-full bg-[rgba(247,244,238,0.78)] rounded-[1px] transition-[opacity,transform] duration-[200ms] ease-in" />
								<span className="block h-[1.5px] w-full bg-[rgba(247,244,238,0.78)] rounded-[1px] transition-transform duration-[200ms] ease-in" />
							</button>
						) : null}
					</div>
				</div>

				<div
					className="h-px bg-[linear-gradient(90deg,rgba(212,175,55,0)_0%,rgba(212,175,55,0.25)_25%,rgba(212,175,55,0.55)_50%,rgba(212,175,55,0.25)_75%,rgba(212,175,55,0)_100%)]"
					aria-hidden
				/>
			</header>
		</>
	);
}
