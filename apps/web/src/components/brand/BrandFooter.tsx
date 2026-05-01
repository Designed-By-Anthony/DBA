import Link from "next/link";
import { stackBadge } from "@/design-system/buttons";
import { FOOTER_LOCATION_TAGLINE } from "@/design-system/location";
import {
	SITE_BRAND,
	SITE_FOOTER_LINKS,
	SITE_LEGAL_LINKS,
	SITE_WORDMARK_ALT,
} from "@/design-system/site-config";

const BUILT_WITH = [
	{ label: "Next.js", href: "https://nextjs.org" },
	{ label: "React 19", href: "https://react.dev" },
	{ label: "Tailwind v4", href: "https://tailwindcss.com" },
	{ label: "Cloudflare Pages", href: "https://pages.cloudflare.com" },
	{ label: "Cloudflare Workers", href: "https://workers.cloudflare.com" },
] as const;

export type BrandFooterProps = {
	buildTag?: string;
	poweredBy?: ReadonlyArray<{ label: string; href: string }>;
};

export function BrandFooter({ buildTag, poweredBy }: BrandFooterProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="relative z-[1] mt-[clamp(2.5rem,5vw,4rem)] pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] bg-[linear-gradient(180deg,transparent_0%,rgba(6,8,14,0.65)_40%,rgba(6,8,14,0.92)_100%)]">
			<div
				className="h-px bg-[linear-gradient(90deg,rgba(212,175,55,0)_0%,rgba(212,175,55,0.4)_50%,rgba(212,175,55,0)_100%)]"
				aria-hidden
			/>

			<div className="max-w-[80rem] mx-auto py-5 pb-[1.1rem]">
				<div className="flex items-center flex-wrap gap-x-6 gap-y-3">
					<Link
						href={SITE_BRAND.homeHref}
						className="inline-flex items-center shrink-0 max-w-[min(85vw,12rem)]"
						aria-label={SITE_WORDMARK_ALT}
					>
						{/* biome-ignore lint/performance/noImgElement: Direct SVG wordmark keeps the bronze period locked to the master asset. */}
						<img
							src="/logos/anthony_master_wordmark.svg"
							alt="ANTHONY."
							className="block h-6 w-auto opacity-90 transition-opacity duration-200 hover:opacity-100 md:h-7"
						/>
					</Link>

					<nav
						className="flex flex-row flex-wrap gap-x-4 gap-y-1"
						aria-label="Footer navigation"
					>
						{SITE_FOOTER_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="text-[0.78rem] text-[rgba(247,244,238,0.55)] no-underline transition-colors duration-[180ms] ease-in whitespace-nowrap hover:text-[rgba(247,244,238,0.92)]"
							>
								{link.label}
							</Link>
						))}
					</nav>

					{/* Language switcher */}
					<div className="flex items-center gap-[0.3rem] shrink-0">
						<a
							href="/"
							hrefLang="en"
							aria-label="View site in English"
							className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[rgba(247,244,238,0.85)] no-underline px-[0.45rem] py-[0.18rem] rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] hover:border-[rgba(212,175,55,0.4)] hover:text-[rgba(212,175,55,0.9)] transition-colors duration-[180ms] ease-in"
						>
							EN
						</a>
						<span
							className="text-[rgba(255,255,255,0.22)] text-[0.6rem]"
							aria-hidden
						>
							|
						</span>
						<a
							href="/es"
							hrefLang="es"
							aria-label="Ver el sitio en español"
							className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-[rgba(247,244,238,0.48)] no-underline px-[0.45rem] py-[0.18rem] rounded-full border border-transparent hover:border-[rgba(212,175,55,0.3)] hover:text-[rgba(212,175,55,0.8)] transition-colors duration-[180ms] ease-in"
						>
							ES
						</a>
					</div>

					{/* Legal + copyright */}
					<div className="flex items-center flex-wrap gap-x-[0.55rem] gap-y-[0.35rem] ml-auto text-[0.7rem] text-[rgba(247,244,238,0.38)] max-sm:ml-0">
						<p className="m-0 max-sm:max-w-none max-w-[min(52rem,92vw)] text-[rgba(247,244,238,0.42)] leading-snug">
							© {year}{" "}
							<span className="text-[rgba(247,244,238,0.55)]">
								{SITE_BRAND.displayNameShort}
								<span className="text-[rgb(var(--accent-bronze-rgb))]">.</span>
								{" | "}
								{FOOTER_LOCATION_TAGLINE}
							</span>
						</p>
						{SITE_LEGAL_LINKS.map((link) => (
							<span
								key={link.href}
								className="inline-flex items-center gap-[0.55rem]"
							>
								<span className="text-[rgba(247,244,238,0.22)]" aria-hidden>
									·
								</span>
								<Link
									href={link.href}
									className="text-[rgba(247,244,238,0.48)] no-underline transition-colors duration-[180ms] ease-in hover:text-[rgba(247,244,238,0.82)]"
								>
									{link.label}
								</Link>
							</span>
						))}
						{buildTag ? (
							<span className="inline-flex items-center gap-[0.55rem]">
								<span className="text-[rgba(247,244,238,0.22)]" aria-hidden>
									·
								</span>
								<span className="font-mono text-[rgba(212,175,55,0.55)] text-[0.66rem] tracking-[0.06em]">
									{buildTag}
								</span>
							</span>
						) : null}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-x-2 gap-y-[0.35rem] pt-[0.7rem] border-t border-[rgba(255,255,255,0.06)] mt-[0.65rem]">
					<span className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-[rgba(247,244,238,0.28)] mr-[0.15rem] shrink-0">
						Built with
					</span>
					{BUILT_WITH.map(({ label, href }) => (
						<a
							key={label}
							href={href}
							className={stackBadge}
							target="_blank"
							rel="noopener noreferrer"
						>
							{label}
						</a>
					))}
				</div>

				{poweredBy?.length ? (
					<div className="flex flex-wrap items-center gap-x-2 gap-y-[0.35rem] pt-[0.7rem] border-t border-[rgba(255,255,255,0.06)] mt-[0.65rem]">
						<span className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-[rgba(247,244,238,0.28)] mr-[0.15rem] shrink-0">
							Powered by
						</span>
						{poweredBy.map(({ label, href }) => (
							<a
								key={label}
								href={href}
								className={stackBadge}
								target="_blank"
								rel="noopener noreferrer"
							>
								{label}
							</a>
						))}
					</div>
				) : null}
			</div>
		</footer>
	);
}
