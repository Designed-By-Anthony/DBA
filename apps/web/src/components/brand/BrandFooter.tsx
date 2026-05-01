import Image from "next/image";
import Link from "next/link";
import { stackBadge } from "@/design-system/buttons";
import {
	SITE_BRAND,
	SITE_FOOTER_LINKS,
	SITE_LEGAL_LINKS,
	SITE_SOCIAL_LINKS,
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
		<footer className="dba-footer">
			<div className="dba-footer-inner">
				<div className="dba-footer-primary">
					<Link
						href={SITE_BRAND.homeHref}
						className="dba-footer-brand"
						aria-label={`${SITE_BRAND.name} — home`}
					>
						<Image
							src={SITE_BRAND.assets.mark}
							alt="Designed by Anthony logo"
							width={22}
							height={16}
							className="dba-footer-mark"
						/>
						<span>
							<span className="dba-footer-brand-name">{SITE_BRAND.name}</span>
							<small>{SITE_BRAND.footerDescription}</small>
						</span>
					</Link>

					<nav className="dba-footer-nav" aria-label="Footer navigation">
						{SITE_FOOTER_LINKS.map((link) => (
							<Link key={link.href} href={link.href}>
								{link.label}
							</Link>
						))}
					</nav>
				</div>

				<div className="dba-footer-meta-grid">
					<div className="dba-footer-stack">
						<span className="dba-footer-stack-label">Built with</span>
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

					<div className="dba-footer-stack">
						<span className="dba-footer-stack-label">Social</span>
						{SITE_SOCIAL_LINKS.map(({ label, href }) => (
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
						<div className="dba-footer-stack">
							<span className="dba-footer-stack-label">Powered by</span>
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

				<div className="dba-footer-legal">
					<p className="dba-footer-copy">
						© {year} {SITE_BRAND.name}
					</p>
					{SITE_LEGAL_LINKS.map((link) => (
						<Link key={link.href} href={link.href}>
							{link.label}
						</Link>
					))}
					{buildTag ? <span>{buildTag}</span> : null}
				</div>
			</div>
		</footer>
	);
}
