import Link from "next/link";
import { notFound } from "next/navigation";
import { homeFaqEntries, homeFooterCta } from "@/data/home";
import { getServiceAreaLongformSections } from "@/data/longformContent";
import {
	getServiceAreaLocation,
	serviceAreaLocations,
} from "@/data/serviceAreaLocations";
import { staticMarketingPageCopy } from "@/data/staticMarketingPages";
import {
	ENTERPRISE_WEBSITE_STARTING_PRICE,
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	PUBLIC_LAUNCH_BUNDLE_COPY,
	PUBLIC_STANDARD_PAYMENT_PLAN,
	STANDARD_WEBSITE_INSTALLMENT_EACH,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "@/lib/offers";
import {
	type BreadcrumbItem,
	buildBreadcrumbSchema,
	buildBreadcrumbs,
	buildFaqPageSchema,
	buildMarketingWebPageSchema,
	buildPricingOfferCatalogSchema,
} from "@/lib/seo";
import { MarketingChrome } from "./MarketingChrome";

function MarketingBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	if (items.length < 2) {
		return null;
	}

	return (
		<nav
			className="breadcrumb-nav marketing-breadcrumb-nav"
			aria-label="Breadcrumb"
		>
			<div className="breadcrumb-container">
				<ol className="breadcrumbs">
					{items.map((item, i) => {
						const isLast = i === items.length - 1;
						return (
							<li key={item.path} className="breadcrumb-item">
								{isLast ? (
									<span aria-current="page">{item.name}</span>
								) : (
									<Link href={item.path}>{item.name}</Link>
								)}
							</li>
						);
					})}
				</ol>
			</div>
		</nav>
	);
}

/** WebPage + BreadcrumbList for a marketing page (avoids duplicate JSON-LD). */
function MarketingPageJsonLd({
	pathname,
	schemaName,
	description,
	breadcrumbLabel,
}: {
	pathname: string;
	schemaName: string;
	description: string;
	breadcrumbLabel: string;
}) {
	const crumbs = buildBreadcrumbs(pathname, breadcrumbLabel);
	const webPage = buildMarketingWebPageSchema({
		pathname,
		name: schemaName,
		description,
	});
	const breadcrumbJson = buildBreadcrumbSchema(pathname, crumbs);

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from schema builders
				dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
			/>
			{breadcrumbJson ? (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from schema builders
					dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
				/>
			) : null}
		</>
	);
}

function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<section className="section-shell section-shell--wash marketing-page-hero marketing-page-hero--editorial">
			<div className="marketing-hero-aurora" aria-hidden="true">
				<span className="marketing-hero-aurora__glow marketing-hero-aurora__glow--a" />
				<span className="marketing-hero-aurora__glow marketing-hero-aurora__glow--b" />
			</div>
			<div className="section-container marketing-page-hero__inner">
				<div className="section-header marketing-page-hero__header">
					<h1 className="page-title reveal-up">{title}</h1>
					{subtitle ? <p className="page-lead reveal-up">{subtitle}</p> : null}
				</div>
			</div>
		</section>
	);
}

export function AboutPage() {
	const copy = staticMarketingPageCopy.about;
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<MarketingPageJsonLd
				pathname="/about"
				schemaName={copy.title}
				description={copy.description}
				breadcrumbLabel={copy.title}
			/>
			<PageHero
				title="About Designed by Anthony"
				subtitle="Marine Corps veteran–led Mohawk Valley web design studio for service businesses across Central New York."
			/>
			<section className="section-shell">
				<div className="section-container marketing-prose">
					<p className="reveal-up">
						Anthony builds custom websites, local SEO programs, managed hosting,
						and website rescues for contractors, home-service pros, medspas,
						salons, and other small businesses across Utica, Rome, Syracuse, and
						greater CNY.
					</p>
					<p className="reveal-up">
						You work directly with the person writing the code — no
						bait-and-switch account team, no offshore ticket queue.
					</p>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">How we work</p>
						<h2>Values that shape every project.</h2>
					</div>
					<div className="values-grid">
						<article className="surface-card value-card reveal-left">
							<div className="value-card-icon" aria-hidden="true">
								⚡
							</div>
							<h3>Speed is respect</h3>
							<p>
								Fast pages respect your visitors' time. Every build ships
								mobile-first, performance-tuned, and scored against Google's own
								report card before launch.
							</p>
						</article>
						<article className="surface-card value-card reveal-up">
							<div className="value-card-icon" aria-hidden="true">
								🎯
							</div>
							<h3>One builder, end to end</h3>
							<p>
								Strategy, design, code, SEO, and support — one person
								accountable for the entire project. No handoff chain, no mystery
								subcontractors.
							</p>
						</article>
						<article className="surface-card value-card reveal-right">
							<div className="value-card-icon" aria-hidden="true">
								🛡️
							</div>
							<h3>Veteran discipline</h3>
							<p>
								Marine Corps–trained attention to detail. Deadlines are
								commitments, communication is direct, and nothing ships until it
								meets the standard.
							</p>
						</article>
						<article className="surface-card value-card reveal-up">
							<div className="value-card-icon" aria-hidden="true">
								🔑
							</div>
							<h3>You own the code</h3>
							<p>
								When you pay for a site, you own it — source code, assets, all
								of it. No hostage fees, no takedowns. The monthly plan is for
								SEO and hosting, not for keeping your site alive.
							</p>
						</article>
					</div>
				</div>
			</section>
			<section className="section-shell">
				<div className="section-container">
					<div className="stat-strip reveal-scale">
						<div className="stat-item">
							<span className="stat-value">{FOUNDING_PARTNER_BUILD_SLOTS}</span>
							<span className="stat-label">Launch pilot spots</span>
						</div>
						<div className="stat-item">
							<span className="stat-value">2–4 wk</span>
							<span className="stat-label">Typical build time</span>
						</div>
						<div className="stat-item">
							<span className="stat-value">1 day</span>
							<span className="stat-label">Reply guarantee</span>
						</div>
						<div className="stat-item">
							<span className="stat-value">100%</span>
							<span className="stat-label">Approval before launch</span>
						</div>
					</div>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div
					className="section-container marketing-cta-row reveal-up"
					style={{ justifyContent: "center" }}
				>
					<a
						href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
						className="btn btn-primary-book"
						data-calendar-link
					>
						Book a 15-minute call
					</a>
					<Link href="/contact" className="btn btn-secondary-proof">
						Contact
					</Link>
				</div>
			</section>
		</MarketingChrome>
	);
}

export function PricingPage() {
	const copy = staticMarketingPageCopy.pricing;
	const pricingCatalog = buildPricingOfferCatalogSchema();
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<MarketingPageJsonLd
				pathname="/pricing"
				schemaName={copy.title}
				description={copy.description}
				breadcrumbLabel={copy.title}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from schema builders
				dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingCatalog) }}
			/>
			<PageHero
				title="Pricing"
				subtitle="Easy payments at launch, three months of hosting + SEO included, then optional Growth Plan."
			/>
			<section className="section-shell">
				<div className="section-container marketing-prose">
					<p className="reveal-up">
						{PUBLIC_STANDARD_PAYMENT_PLAN} {PUBLIC_LAUNCH_BUNDLE_COPY} When the
						build is done, you own the source code — no lock-in, no takedown if
						you leave. Book a short intro call for a written estimate tailored
						to your pages, integrations, and SEO depth.
					</p>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<div className="pricing-tiers">
						<article className="surface-card pricing-tier reveal-left">
							<p className="pricing-tier-name">Simple Site</p>
							<p className="pricing-tier-price">
								<span className="pricing-tier-from">from </span>
								{STANDARD_WEBSITE_STARTING_PRICE}
							</p>
							<p className="pricing-tier-desc">
								Single-service landing pages and simple brochure sites for local
								businesses starting out or testing a market.
							</p>
							<ul className="pricing-tier-features">
								<li>Mobile-first responsive design</li>
								<li>On-page SEO structure</li>
								<li>Contact form with Turnstile</li>
								<li>Lighthouse performance tuning</li>
								<li>Full source code handed to you at launch</li>
							</ul>
						</article>
						<article className="surface-card pricing-tier pricing-tier--featured reveal-scale">
							<span className="pricing-tier-badge">Most popular</span>
							<p className="pricing-tier-name">Standard Rebuild</p>
							<p className="pricing-tier-price pricing-tier-price--stacked">
								<span className="pricing-tier-installments">
									3 × {STANDARD_WEBSITE_INSTALLMENT_EACH}
								</span>
								<span className="pricing-tier-range-note">
									Typical total {STANDARD_WEBSITE_TYPICAL_RANGE}
								</span>
							</p>
							<p className="pricing-tier-desc">
								Full custom site for service businesses ready to rank locally
								and convert visitors into calls. 5–10 pages, custom design, and
								technical SEO — plus three months on us for hosting, security,
								and core local SEO before the monthly Growth Plan.
							</p>
							<ul className="pricing-tier-features">
								<li>Everything in Simple Site</li>
								<li>Multi-page custom layout</li>
								<li>Local SEO and schema markup</li>
								<li>Google Business Profile alignment</li>
								<li>CRM integration ready</li>
								<li>Source code is yours — no lock-in</li>
							</ul>
						</article>
						<article className="surface-card pricing-tier reveal-right">
							<p className="pricing-tier-name">Enterprise</p>
							<p className="pricing-tier-price">
								<span className="pricing-tier-from">from </span>
								{ENTERPRISE_WEBSITE_STARTING_PRICE}
							</p>
							<p className="pricing-tier-desc">
								Multi-location, integration-heavy, or franchise scope — CRM,
								booking, and advanced SEO across service areas.
							</p>
							<ul className="pricing-tier-features">
								<li>Everything in Standard</li>
								<li>Multi-location pages</li>
								<li>CRM and booking integrations</li>
								<li>Advanced analytics setup</li>
								<li>Priority support channel</li>
							</ul>
						</article>
					</div>
				</div>
			</section>
			<section className="section-shell">
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Founding partner program</p>
						<h2>Or skip the build cost entirely.</h2>
						<p>
							{FOUNDING_PARTNER_BUILD_SLOTS} founding partner spots pair a
							complimentary custom build with the {FOUNDING_PARTNER_SEO_MONTHLY}
							/mo {FOUNDING_PARTNER_SEO_LABEL} — hosting, security, and SEO
							included.
						</p>
					</div>
					<div
						className="marketing-cta-row reveal-up"
						style={{ justifyContent: "center" }}
					>
						<a
							href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
							className="btn btn-primary-book"
							data-calendar-link
						>
							Book a call to confirm fit
						</a>
						<Link href="/contact" className="btn btn-primary-audit">
							Contact us for your free audit
						</Link>
					</div>
				</div>
			</section>
		</MarketingChrome>
	);
}

export function OurEdgePage() {
	const copy = staticMarketingPageCopy.ouredge;
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<MarketingPageJsonLd
				pathname="/ouredge"
				schemaName={copy.title}
				description={copy.description}
				breadcrumbLabel={copy.title}
			/>
			<PageHero
				title="Our Edge"
				subtitle="Why our sites feel different — performance, structure, and long-term maintainability."
			/>
			<section className="section-shell">
				<div className="section-container marketing-prose">
					<p className="reveal-up">
						We build lean, fast marketing sites with modern tooling so you are
						not fighting plugins, template drift, or mystery bloat six months
						after launch.
					</p>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<div className="section-header centered">
						<h2>Template builders vs. a custom build.</h2>
						<p>
							The difference shows up in speed, search placement, and what
							breaks next month.
						</p>
					</div>
					<div className="comparison-grid">
						<div className="surface-card comparison-column comparison-column--them reveal-left">
							<span className="comparison-label">Typical template site</span>
							<ul className="comparison-list">
								<li>Dozens of plugins to patch every week</li>
								<li>Heavy page weight — slow on phones</li>
								<li>Generic layouts that look like everyone else</li>
								<li>SEO bolted on after the fact</li>
								<li>Mystery breaks after updates</li>
								<li>Support through a ticket queue</li>
								<li>
									Agency keeps the code — site vanishes if you stop paying
								</li>
							</ul>
						</div>
						<div className="surface-card comparison-column comparison-column--us reveal-right">
							<span className="comparison-label">Designed by Anthony</span>
							<ul className="comparison-list">
								<li>Zero plugin dependencies</li>
								<li>Sub-second load on mobile networks</li>
								<li>Custom layout tuned for your business</li>
								<li>SEO baked into the architecture from day one</li>
								<li>Nothing to patch — less to break</li>
								<li>Direct line to the builder</li>
								<li>You own the code — it never gets taken down</li>
							</ul>
						</div>
					</div>
				</div>
			</section>
			<section className="section-shell">
				<div className="section-container">
					<div className="stat-strip reveal-scale">
						<div className="stat-item">
							<span className="stat-value">90+</span>
							<span className="stat-label">Lighthouse scores shipped</span>
						</div>
						<div className="stat-item">
							<span className="stat-value">0</span>
							<span className="stat-label">Plugins to maintain</span>
						</div>
						<div className="stat-item">
							<span className="stat-value">&lt;1s</span>
							<span className="stat-label">Target mobile load</span>
						</div>
					</div>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div
					className="section-container marketing-cta-row reveal-up"
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className="btn btn-primary-audit">
						Contact us for your free audit
					</Link>
					<Link href="/services" className="btn btn-secondary-proof">
						View services
					</Link>
				</div>
			</section>
		</MarketingChrome>
	);
}

export function FaqPage() {
	const copy = staticMarketingPageCopy.faq;
	const faqSchema = buildFaqPageSchema(
		homeFaqEntries.map(({ question, answer }) => ({ question, answer })),
		{ path: "/faq" },
	);
	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<MarketingPageJsonLd
				pathname="/faq"
				schemaName={copy.title}
				description={copy.description}
				breadcrumbLabel={copy.title}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from schema builders
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
			/>
			<PageHero
				title="FAQ"
				subtitle="Quick answers before you spend a dollar."
			/>
			<section className="section-shell">
				<div className="section-container">
					<div className="home-faq-list" data-exclusive-details>
						{homeFaqEntries.map((entry) => (
							<details
								key={entry.question}
								className="surface-card home-faq-item reveal-up"
							>
								<summary>
									<span className="home-faq-question">{entry.question}</span>
									<span className="home-faq-toggle" aria-hidden="true" />
								</summary>
								<div className="home-faq-answer">
									<p>{entry.answer}</p>
								</div>
							</details>
						))}
					</div>
					<div
						className="marketing-cta-row reveal-up"
						style={{
							justifyContent: "center",
							marginTop: "clamp(2rem, 4vw, 3rem)",
						}}
					>
						<Link href="/contact" className="btn btn-primary-book">
							Still have a question? Contact us
						</Link>
						<Link href="/contact" className="btn btn-primary-audit">
							Contact us for your free audit
						</Link>
					</div>
				</div>
			</section>
		</MarketingChrome>
	);
}

export function ServiceAreasPage() {
	const copy = staticMarketingPageCopy["service-areas"];
	const crumbs = buildBreadcrumbs("/service-areas", "Service Areas");
	const longform = getServiceAreaLongformSections("Service Areas");
	const coreMarketCount = serviceAreaLocations.filter(
		(r) => r.tag === "primary",
	).length;
	const remoteMarketCount = serviceAreaLocations.filter(
		(r) => r.tag === "secondary",
	).length;

	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<MarketingPageJsonLd
				pathname="/service-areas"
				schemaName={copy.title}
				description={copy.description}
				breadcrumbLabel="Service Areas"
			/>
			<MarketingBreadcrumbs items={crumbs} />
			<PageHero
				title="Service Areas"
				subtitle="Mohawk Valley, Central NY, and select national markets."
			/>
			<section className="section-shell">
				<div className="section-container marketing-prose">
					<p className="reveal-up">
						Primary work is anchored in Rome, NY, with regular coverage across
						Utica, Syracuse, and the broader Mohawk Valley. We also support
						select remote clients on a case-by-case basis.
					</p>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="service-area-signal-strip reveal-up">
						<div className="surface-card service-area-signal">
							<span className="service-area-signal__label">Core Markets</span>
							<span className="service-area-signal__value">
								{coreMarketCount}
							</span>
						</div>
						<div className="surface-card service-area-signal">
							<span className="service-area-signal__label">Remote Markets</span>
							<span className="service-area-signal__value">
								{remoteMarketCount}
							</span>
						</div>
						<div className="surface-card service-area-signal">
							<span className="service-area-signal__label">
								Response Window
							</span>
							<span className="service-area-signal__value">1 Business Day</span>
						</div>
					</div>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<div className="region-grid">
						{serviceAreaLocations.map((r) => (
							<Link
								key={r.slug}
								href={`/service-areas/${r.slug}`}
								className="surface-card region-card region-card-link reveal-up"
							>
								<span className={`region-card-tag region-card-tag--${r.tag}`}>
									{r.tag === "primary" ? "Core market" : "Remote"}
								</span>
								<h3>{r.name}</h3>
								<p>{r.cardTeaser}</p>
								<span className="region-card-more">
									Local web design guide →
								</span>
							</Link>
						))}
					</div>
				</div>
			</section>
			{longform.map((section) => (
				<section
					key={section.heading}
					className="section-shell section-shell--longform"
				>
					<div className="section-container marketing-prose marketing-prose--longform">
						<div className="section-divider-glow" aria-hidden="true" />
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p) => (
							<p key={p} className="reveal-up">
								{p}
							</p>
						))}
					</div>
				</section>
			))}
			<section className="section-shell">
				<div
					className="section-container marketing-cta-row reveal-up"
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className="btn btn-primary-book">
						Contact the studio
					</Link>
					<Link href="/contact" className="btn btn-primary-audit">
						Contact us for your free audit
					</Link>
				</div>
			</section>
		</MarketingChrome>
	);
}

export function ServiceAreaLocationPage({ slug }: { slug: string }) {
	const loc = getServiceAreaLocation(slug);
	if (!loc) {
		notFound();
	}

	const pathname = `/service-areas/${loc.slug}`;
	const crumbs = buildBreadcrumbs(pathname, loc.name);
	const otherAreas = serviceAreaLocations.filter((a) => a.slug !== loc.slug);
	const longform = getServiceAreaLongformSections(loc.name);

	return (
		<MarketingChrome footerCta={homeFooterCta}>
			<MarketingPageJsonLd
				pathname={pathname}
				schemaName={`Web design ${loc.name}`}
				description={loc.metaDescription}
				breadcrumbLabel={loc.name}
			/>
			<MarketingBreadcrumbs items={crumbs} />
			<PageHero
				title={`Web design & local SEO — ${loc.name}`}
				subtitle={loc.heroSubtitle}
			/>
			<section className="section-shell">
				<div className="section-container marketing-prose">
					{loc.intro.map((p) => (
						<p key={p} className="reveal-up">
							{p}
						</p>
					))}
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="local-context-chips reveal-up">
						<span className="local-context-chip">
							{loc.tag === "primary" ? "Core Market" : "Remote Market"}
						</span>
						<span className="local-context-chip">Mobile-First Build</span>
						<span className="local-context-chip">Local SEO Included</span>
						<span className="local-context-chip">Manual Launch QA</span>
					</div>
				</div>
			</section>
			{loc.sections.map((section) => (
				<section
					key={section.heading}
					className="section-shell section-shell--wash"
				>
					<div className="section-container marketing-prose">
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p) => (
							<p key={p} className="reveal-up">
								{p}
							</p>
						))}
					</div>
				</section>
			))}
			{longform.map((section) => (
				<section
					key={section.heading}
					className="section-shell section-shell--longform"
				>
					<div className="section-container marketing-prose marketing-prose--longform">
						<div className="section-divider-glow" aria-hidden="true" />
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p) => (
							<p key={p} className="reveal-up">
								{p}
							</p>
						))}
					</div>
				</section>
			))}
			<section className="section-shell">
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">More areas</p>
						<h2>Other markets we serve</h2>
						<p className="page-lead reveal-up">
							Each page explains how we approach web design and local SEO in
							that market — browse another city or{" "}
							<Link href="/service-areas">return to the full list</Link>.
						</p>
					</div>
					<div className="region-grid">
						{otherAreas.map((r) => (
							<Link
								key={r.slug}
								href={`/service-areas/${r.slug}`}
								className="surface-card region-card region-card-link reveal-up"
							>
								<span className={`region-card-tag region-card-tag--${r.tag}`}>
									{r.tag === "primary" ? "Core market" : "Remote"}
								</span>
								<h3>{r.name}</h3>
								<p>{r.cardTeaser}</p>
								<span className="region-card-more">Read the local guide →</span>
							</Link>
						))}
					</div>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div
					className="section-container marketing-cta-row reveal-up"
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className="btn btn-primary-book">
						Contact the studio
					</Link>
					<Link href="/contact" className="btn btn-primary-audit">
						Contact us for your free audit
					</Link>
				</div>
			</section>
		</MarketingChrome>
	);
}
