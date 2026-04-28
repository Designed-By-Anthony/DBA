import Image from "next/image";
import Link from "next/link";
import {
	SITE_BRAND,
	SITE_FOOTER_LINKS,
	SITE_LEGAL_LINKS,
} from "@/design-system/site-config";

export type BrandFooterProps = {
	/** Optional small mono build tag (e.g. "Lighthouse Scanner v2") shown next to legal links. */
	buildTag?: string;
};

export function BrandFooter({ buildTag }: BrandFooterProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="dba-footer">
			<div className="dba-footer-rule" aria-hidden />
			<div className="dba-footer-inner">
				<div className="dba-footer-row">
					<Link
						href={SITE_BRAND.homeHref}
						className="dba-footer-brand"
						aria-label={`${SITE_BRAND.name} — home`}
					>
						<Image
							src={SITE_BRAND.assets.mark}
							alt=""
							width={22}
							height={16}
							className="dba-footer-mark"
						/>
						<span className="dba-footer-brand-name">{SITE_BRAND.name}</span>
					</Link>

					<nav className="dba-footer-nav" aria-label="Footer navigation">
						{SITE_FOOTER_LINKS.map((link) => (
							<Link key={link.href} href={link.href}>
								{link.label}
							</Link>
						))}
					</nav>

					<div className="dba-footer-legal">
						<p className="dba-footer-copy">© {year} {SITE_BRAND.name}</p>
						{SITE_LEGAL_LINKS.map((link) => (
							<span key={link.href} className="dba-footer-legal-item">
								<span className="dba-footer-sep" aria-hidden>·</span>
								<Link href={link.href}>{link.label}</Link>
							</span>
						))}
						{buildTag ? (
							<span className="dba-footer-legal-item">
								<span className="dba-footer-sep" aria-hidden>·</span>
								<span className="dba-footer-meta font-mono">{buildTag}</span>
							</span>
						) : null}
					</div>
				</div>
			</div>
		</footer>
	);
}
