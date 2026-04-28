import Image from "next/image";
import Link from "next/link";
import {
	SITE_BRAND,
	SITE_FOOTER_LINKS,
	SITE_LEGAL_LINKS,
	SITE_SOCIAL_LINKS,
} from "@/design-system/site-config";

export function SiteFooter() {
	const year = new Date().getFullYear();
	return (
		<footer className="footer footer--slim">
			<div className="footer-container footer-container--slim">
				<div className="footer-row">
					<Link
						href="/"
						className="footer-logo-link"
						aria-label="Designed by Anthony home"
					>
						<Image
							src={SITE_BRAND.assets.mark}
							alt={`${SITE_BRAND.name} Logo`}
							width={36}
							height={27}
							className="footer-logo"
						/>
					</Link>

					<nav className="footer-nav" aria-label="Footer navigation">
						{SITE_FOOTER_LINKS.map((link) => (
							<Link key={link.href} href={link.href}>
								{link.label}
							</Link>
						))}
					</nav>

					<div className="footer-social-links">
						{SITE_SOCIAL_LINKS.map((link) => (
							<a
								key={link.href}
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
							>
								{link.label}
							</a>
						))}
					</div>
				</div>

				<div className="footer-tech-badges">
					<p className="footer-tech-badges__label">Built with</p>
					<ul className="footer-tech-badges__list">
						<li>
							<a
								href="https://nextjs.org"
								className="footer-stack-badge"
								target="_blank"
								rel="noopener noreferrer"
							>
								Next.js
							</a>
						</li>
						<li>
							<a
								href="https://firebase.google.com/docs/hosting"
								className="footer-stack-badge"
								target="_blank"
								rel="noopener noreferrer"
							>
								Firebase Hosting
							</a>
						</li>
						<li>
							<a
								href="https://www.cloudflare.com"
								className="footer-stack-badge"
								target="_blank"
								rel="noopener noreferrer"
							>
								Cloudflare
							</a>
						</li>
						<li>
							<a
								href="https://cloud.google.com/recaptcha-enterprise"
								className="footer-stack-badge"
								target="_blank"
								rel="noopener noreferrer"
							>
								reCAPTCHA Enterprise
							</a>
						</li>
					</ul>
				</div>

				<div className="footer-bottom">
					<p>
						© {year} {SITE_BRAND.name}
					</p>
					<span className="footer-sep">·</span>
					{SITE_LEGAL_LINKS.map((link) => (
						<Link key={link.href} href={link.href}>
							{link.label}
						</Link>
					))}
					<span className="footer-sep">·</span>
					<button
						type="button"
						className="footer-cookie-settings"
						data-cookie-settings
					>
						Cookie settings
					</button>
				</div>
			</div>
		</footer>
	);
}
