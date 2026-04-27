import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS } from "@/design-system/brand";

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
							src={BRAND_ASSETS.mark}
							alt="Designed by Anthony Logo"
							width={36}
							height={27}
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
