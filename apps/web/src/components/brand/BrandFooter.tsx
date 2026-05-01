import Image from "next/image";
import Link from "next/link";
import { stackBadge } from "@/design-system/buttons";
import {
	SITE_BRAND,
	SITE_FOOTER_LINKS,
	SITE_LEGAL_LINKS,
} from "@/design-system/site-config";

const BUILT_WITH = [
	{ label: "Next.js", href: "https://nextjs.org" },
	{ label: "React 19", href: "https://react.dev" },
	{ label: "Tailwind v4", href: "https://tailwindcss.com" },
	{ label: "Cloudflare Pages", href: "https://pages.cloudflare.com" },
	{ label: "Cloudflare Workers", href: "https://workers.cloudflare.com" },
] as const;

export type BrandFooterProps = {
	/** Optional small mono build tag (e.g. "Lighthouse Scanner v2") shown next to legal links. */
	buildTag?: string;
	/** Optional contextual "Powered by" chips shown below the standard Built-with row. */
	poweredBy?: ReadonlyArray<{ label: string; href: string }>;
};

export function BrandFooter({ buildTag, poweredBy }: BrandFooterProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="relative z-[1] mt-[clamp(2.5rem,5vw,4rem)] pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] bg-[linear-gradient(180deg,transparent_0%,rgba(6,8,14,0.65)_40%,rgba(6,8,14,0.92)_100%)]">
			{/* Bronze accent rule */}
			<div
				className="h-px bg-[linear-gradient(90deg,rgba(212,175,55,0)_0%,rgba(212,175,55,0.4)_50%,rgba(212,175,55,0)_100%)]"
				aria-hidden
			/>

			<div className="max-w-[80rem] mx-auto py-5 pb-[1.1rem]">
				{/* Single compact row */}
				<div className="flex items-center flex-wrap gap-x-6 gap-y-3">
					{/* Brand lockup */}
					<Link
						href={SITE_BRAND.homeHref}
						className="inline-flex items-center gap-2 no-underline shrink-0"
						aria-label={`${SITE_BRAND.name} — home`}
					>
						<Image
							src={SITE_BRAND.assets.mark}
							alt="Designed by Anthony logo"
							width={22}
							height={16}
							className="shrink-0"
							style={{ width: "auto" }}
						/>
						<span className="font-[family-name:var(--font-fraunces)] text-[0.88rem] font-semibold tracking-[-0.015em] text-[rgba(247,244,238,0.88)] leading-none">
							{SITE_BRAND.name}
						</span>
					</Link>

					{/* Footer nav */}
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

					{/* Legal + copyright */}
					<div className="flex items-center flex-wrap gap-x-[0.55rem] gap-y-[0.35rem] ml-auto text-[0.7rem] text-[rgba(247,244,238,0.38)] max-sm:ml-0">
						<p className="m-0 whitespace-nowrap">
							© {year} {SITE_BRAND.name}
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

				{/* Built-with chips */}
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

				{/* Optional powered-by chips */}
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
