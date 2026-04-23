import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS } from "@/design-system/brand";

export function SiteFooter() {
	const year = new Date().getFullYear();
	return (
		<footer className="footer" id="contact">
			<div className="footer-container">
				<Link href="/" className="footer-logo-link" aria-label="Designed by Anthony home">
					<Image
						src={BRAND_ASSETS.mark}
						alt="Designed by Anthony Logo"
						width={48}
						height={36}
						className="footer-logo"
					/>
				</Link>

				<div className="footer-link-column">
					<p className="footer-heading">Explore</p>
					<div className="footer-link-list">
						<Link href="/services">Services</Link>
						<Link href="/pricing">Pricing</Link>
						<Link href="/service-areas">Areas</Link>
						<Link href="/portfolio">Portfolio</Link>
						<Link href="/blog">Blog</Link>
					</div>
				</div>

				<div className="footer-link-column">
					<p className="footer-heading">Reach Out</p>
					<div className="footer-link-list">
						<Link href="/contact">Contact</Link>
						<a href="tel:+13159225592">(315) 922-5592</a>
						<Link href="/about">About</Link>
					</div>
				</div>

				<div className="footer-link-column">
					<p className="footer-heading">Connect</p>
					<div className="footer-social-links">
						<a
							href="https://share.google/c4NOQf9hkRWAN32rO"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="sr-only">Google Business Profile (opens in new window)</span>
							Google
						</a>
						<a
							href="https://www.yelp.com/biz/designed-by-anthony-rome-2"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="sr-only">Yelp Profile (opens in new window)</span>
							Yelp
						</a>
						<a
							href="https://www.facebook.com/profile.php?id=61574388797744"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="sr-only">Facebook Profile (opens in new window)</span>
							Facebook
						</a>
						<a
							href="https://www.instagram.com/dbastudio315/"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="sr-only">Instagram Profile (opens in new window)</span>
							Instagram
						</a>
					</div>
				</div>

				<a
					href="https://locallyownedandoperated.org/"
					target="_blank"
					rel="nofollow noopener noreferrer"
					className="footer-badge-link"
					aria-label="Locally Owned and Operated (opens in new window)"
				>
					<img
						src="/images/local-owned-badge.png"
						width={88}
						height={100}
						alt=""
						loading="lazy"
					/>
					<span>Locally Owned</span>
				</a>

				<div className="footer-bottom">
					<p>© {year} Designed by Anthony</p>
					<span className="footer-sep">·</span>
					<Link href="/privacy">Privacy</Link>
					<Link href="/terms">Terms</Link>
					<Link href="/cookie">Cookies</Link>
					<Link href="/image-license">Image license</Link>
					<span className="footer-sep">·</span>
					<button type="button" className="footer-cookie-settings" data-cookie-settings>
						Cookie settings
					</button>
					<span className="footer-sep">·</span>
					<a
						href="https://nextjs.org"
						target="_blank"
						rel="noopener noreferrer"
						className="astro-badge"
						aria-label="Built with Next.js (opens in new window)"
					>
						Built with Next.js
					</a>
				</div>
			</div>
		</footer>
	);
}
