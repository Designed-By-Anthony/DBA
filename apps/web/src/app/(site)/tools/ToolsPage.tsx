"use client";

import { useState } from "react";
import {
	PROMO_BOGO,
	PROMO_FOUNDING,
	type Product,
	type ProductTier,
	TOOLS_PRODUCTS,
} from "@/data/tools-products";
import styles from "./tools.module.css";

const ICON_MAP: Record<string, string> = {
	search: "\u{1F50D}",
	bot: "\u{1F916}",
	folder: "\u{1F4C2}",
	mapPin: "\u{1F4CD}",
	star: "\u2B50",
	pen: "\u270D\uFE0F",
};

function ProductIcon({ icon }: { icon: string }) {
	return (
		<span className={styles.productIcon} aria-hidden>
			{ICON_MAP[icon] ?? "\u{1F527}"}
		</span>
	);
}

function TierCard({ tier, annual }: { tier: ProductTier; annual: boolean }) {
	const price = annual ? tier.annualPrice : tier.monthlyPrice;
	const period = annual ? "/yr" : "/mo";
	const link = annual ? tier.annualLink : tier.monthlyLink;
	const isPlaceholder = link === "#";

	return (
		<div
			className={`${styles.tierCard} ${tier.highlight ? styles.tierCardHighlight : ""}`}
		>
			{tier.highlight ? (
				<span className={styles.tierPopular}>Most Popular</span>
			) : null}
			<h4 className={styles.tierName}>{tier.name}</h4>
			<p className={styles.tierPrice}>
				<span className={styles.tierAmount}>${price}</span>
				<span className={styles.tierPeriod}>{period}</span>
			</p>
			{annual ? (
				<p className={styles.tierSavings}>2 months free vs. monthly</p>
			) : null}
			<ul className={styles.tierFeatures}>
				{tier.features.map((f) => (
					<li key={f}>{f}</li>
				))}
			</ul>
			{isPlaceholder ? (
				<span className={styles.tierCtaDisabled}>Coming Soon</span>
			) : (
				<a
					href={link}
					target="_blank"
					rel="noopener noreferrer"
					className={styles.tierCta}
				>
					Get Started
				</a>
			)}
		</div>
	);
}

function ProductSection({ product }: { product: Product }) {
	const [annual, setAnnual] = useState(false);

	return (
		<section
			className={styles.productSection}
			id={product.slug}
			aria-labelledby={`${product.slug}-heading`}
		>
			<div className={styles.productHeader}>
				<ProductIcon icon={product.icon} />
				<div>
					<span className={styles.productCategory}>{product.category}</span>
					<h3 id={`${product.slug}-heading`} className={styles.productName}>
						{product.name}{" "}
						<span className={styles.productTagline}>
							&mdash; {product.tagline}
						</span>
					</h3>
					<p className={styles.productDesc}>{product.description}</p>
				</div>
			</div>

			<fieldset className={styles.billingToggle} aria-label="Billing cycle">
				<button
					type="button"
					className={`${styles.toggleBtn} ${!annual ? styles.toggleBtnActive : ""}`}
					onClick={() => setAnnual(false)}
					aria-pressed={!annual}
				>
					Monthly
				</button>
				<button
					type="button"
					className={`${styles.toggleBtn} ${annual ? styles.toggleBtnActive : ""}`}
					onClick={() => setAnnual(true)}
					aria-pressed={annual}
				>
					Annual <span className={styles.toggleSave}>Save 2 mo</span>
				</button>
			</fieldset>

			<div className={styles.tierGrid}>
				{product.tiers.map((tier) => (
					<TierCard key={tier.name} tier={tier} annual={annual} />
				))}
			</div>
		</section>
	);
}

export function ToolsPage() {
	return (
		<div className={styles.page}>
			{/* Hero */}
			<section className={styles.hero}>
				<p className={styles.badge}>
					<span className={styles.badgeDot} aria-hidden />
					Micro SaaS Store
				</p>
				<h1 className={styles.heading}>
					Purpose-built tools for local service businesses.
				</h1>
				<p className={styles.subheading}>
					Six focused products — SEO monitoring, AI review responses, client
					portals, testimonial collection, and more — priced for freelancers and
					small agencies. No bloat. No enterprise lock-in.
				</p>
			</section>

			{/* Promo banners */}
			<div className={styles.promoStrip}>
				<div className={styles.promoBanner}>
					<span className={styles.promoCode}>{PROMO_FOUNDING.code}</span>
					<span className={styles.promoText}>
						<strong>{PROMO_FOUNDING.label}</strong> &mdash;{" "}
						{PROMO_FOUNDING.discount}. {PROMO_FOUNDING.note}.
					</span>
				</div>
				<div className={styles.promoBanner}>
					<span className={styles.promoCode}>{PROMO_BOGO.code}</span>
					<span className={styles.promoText}>
						<strong>{PROMO_BOGO.label}</strong> &mdash; {PROMO_BOGO.discount}.{" "}
						{PROMO_BOGO.note}.
					</span>
				</div>
			</div>

			{/* Quick nav */}
			<nav className={styles.quickNav} aria-label="Product quick links">
				{TOOLS_PRODUCTS.map((p) => (
					<a key={p.slug} href={`#${p.slug}`} className={styles.quickNavLink}>
						{ICON_MAP[p.icon] ?? "\u{1F527}"} {p.name}
					</a>
				))}
			</nav>

			{/* Product sections */}
			{TOOLS_PRODUCTS.map((product) => (
				<ProductSection key={product.slug} product={product} />
			))}

			{/* Bottom CTA */}
			<section className={styles.bottomCta}>
				<h2 className={styles.bottomCtaHeading}>
					Stack your tools. Save more.
				</h2>
				<p className={styles.bottomCtaText}>
					Use code <strong>{PROMO_FOUNDING.code}</strong> for 50% off your first
					tool forever, then add <strong>{PROMO_BOGO.code}</strong> to get 50%
					off your second subscription. Annual billing saves an additional 2
					months on every tool.
				</p>
			</section>
		</div>
	);
}
