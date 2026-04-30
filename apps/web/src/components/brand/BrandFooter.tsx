import Image from "next/image";
import Link from "next/link";
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
	buildTag?: string;
	poweredBy?: ReadonlyArray<{ label: string; href: string }>;
};

export function BrandFooter({ buildTag, poweredBy }: BrandFooterProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-white/10 bg-[rgba(6,10,18,0.75)]">
			<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-4">
						<Link
							href={SITE_BRAND.homeHref}
							className="inline-flex items-center gap-3"
							aria-label={`${SITE_BRAND.name} — home`}
						>
							<Image
								src={SITE_BRAND.assets.mark}
								alt="Designed by Anthony logo"
								width={26}
								height={20}
								style={{ width: "auto" }}
							/>
							<span className="font-[var(--font-report-display)] text-lg font-semibold text-white">
								{SITE_BRAND.name}
							</span>
						</Link>
						<nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/65">
							{SITE_FOOTER_LINKS.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="transition hover:text-white"
								>
									{link.label}
								</Link>
							))}
						</nav>
					</div>
					<div className="space-y-4 lg:max-w-xl lg:text-right">
						<div className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-white/55 lg:justify-end">
							<span>
								© {year} {SITE_BRAND.name}
							</span>
							{SITE_LEGAL_LINKS.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="transition hover:text-white"
								>
									{link.label}
								</Link>
							))}
							{buildTag ? (
								<span className="font-mono text-xs uppercase tracking-[0.16em] text-[rgb(var(--accent-bronze-rgb)/0.7)]">
									{buildTag}
								</span>
							) : null}
						</div>
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2 lg:justify-end">
								<span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
									Built with
								</span>
								{BUILT_WITH.map(({ label, href }) => (
									<a
										key={label}
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/20 hover:text-white"
									>
										{label}
									</a>
								))}
							</div>
							{poweredBy?.length ? (
								<div className="flex flex-wrap items-center gap-2 lg:justify-end">
									<span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
										Powered by
									</span>
									{poweredBy.map(({ label, href }) => (
										<a
											key={label}
											href={href}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/20 hover:text-white"
										>
											{label}
										</a>
									))}
								</div>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
