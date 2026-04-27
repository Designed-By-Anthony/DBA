import Image from "next/image";
import Link from "next/link";
import { BRAND_MARK_IMAGE } from "@/design-system/brand";

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
							src={BRAND_MARK_IMAGE}
							alt="Designed by Anthony Logo"
							width={BRAND_MARK_IMAGE.width}
							height={BRAND_MARK_IMAGE.height}
							className="footer-logo"
						/>
					</Link>

					<nav className="footer-nav" aria-label="Footer navigation">
						<Link href="/services">Services</Link>
						<Link href="/pricing">Pricing</Link>
						<Link href="/portfolio">Portfolio</Link>
						<Link href="/blog">Blog</Link>
						<Link href="/contact">Contact</Link>
					</nav>

					<div className="footer-social-links">
						<a
							href="https://share.google/c4NOQf9hkRWAN32rO"
							target="_blank"
							rel="noopener noreferrer"
						>
							Google
						</a>
						<a
							href="https://www.facebook.com/profile.php?id=61574388797744"
							target="_blank"
							rel="noopener noreferrer"
						>
							Facebook
						</a>
						<a
							href="https://www.instagram.com/dbastudio315/"
							target="_blank"
							rel="noopener noreferrer"
						>
							Instagram
						</a>
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
								href="https://firebase.google.com/products/app-hosting"
								className="footer-stack-badge"
								target="_blank"
								rel="noopener noreferrer"
							>
								Firebase App Hosting
							</a>
						</li>
						<li>
							<a
								href="https://tailwindcss.com"
								className="footer-stack-badge"
								target="_blank"
								rel="noopener noreferrer"
							>
								Tailwind CSS
							</a>
						</li>
					</ul>
				</div>

				<div className="footer-bottom">
					<p>© {year} Designed by Anthony</p>
					<span className="footer-sep">·</span>
					<Link href="/privacy">Privacy</Link>
					<Link href="/terms">Terms</Link>
					<Link href="/cookie">Cookies</Link>
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
