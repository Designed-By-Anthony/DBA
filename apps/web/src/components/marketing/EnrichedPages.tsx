import Link from "next/link";
import { notFound } from "next/navigation";
import { homeFaqEntries, homeFooterCta } from "@/data/home";
import {
	getServiceAreaDetailLongformSections,
	getServiceAreaLongformSections,
} from "@/data/longformContent";
import { pricingFaqEntries } from "@/data/pricing-faq";
import {
	getServiceAreaLocation,
	serviceAreaLocations,
} from "@/data/serviceAreaLocations";
import { staticMarketingPageCopy } from "@/data/staticMarketingPages";
import {
	btnOutline,
	btnPrimary,
	btnSecondaryProof,
	stackBadge,
} from "@/design-system/buttons";
import {
	BESPOKE_CONFIG_LABEL,
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
	buildVaultCrmSoftwareApplicationSchema,
} from "@/lib/seo";
import { FaqAccordionSummaryAndAnswer } from "./FaqSection";
import { InnerPageMotionSystem } from "./InnerPageMotionSystem";
import { MarketingChrome } from "./MarketingChrome";
import {
	MotionReveal,
	MotionStagger,
	MotionStaggerChild,
} from "./MotionReveal";

function MarketingBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	if (items.length < 2) {
		return null;
	}

	return (
		<nav
			className="bg-white/[0.02] border-b border-white/[0.05] py-3"
			aria-label="Breadcrumb"
		>
			<div className="max-w-[var(--content-max)] mx-auto px-[var(--container-gutter)]">
				<ol className="list-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-[var(--text-gray)] overflow-hidden m-0 p-0">
					{items.map((item, i) => {
						const isLast = i === items.length - 1;
						return (
							<li
								key={item.path}
								className="flex items-center whitespace-nowrap min-w-0 last:overflow-hidden last:[text-overflow:ellipsis] last:flex-shrink before:[content:'/'] before:opacity-30 before:mr-2 before:flex-shrink-0 first:before:hidden last:[&>span]:overflow-hidden last:[&>span]:[text-overflow:ellipsis] last:[&>span]:whitespace-nowrap last:[&>span]:block"
							>
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
				// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
				dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
			/>
			{breadcrumbJson ? (
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
					dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
				/>
			) : null}
		</>
	);
}

function PageHero({
	title,
	subtitle,
	kind = "default",
}: {
	title: string;
	subtitle?: string;
	kind?: string;
}) {
	return (
		<section
			className="section-shell section-shell--wash marketing-page-hero marketing-page-hero--editorial"
			data-page-kind={kind}
		>
			<InnerPageMotionSystem kind={kind} />
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
				kind="about"
				title="About ANTHONY."
				subtitle="Marine Corps veteran–led Mohawk Valley web design studio for service businesses across Central New York."
			/>
			<section className="section-shell">
				<MotionReveal
					className="section-container marketing-prose"
					y={16}
					duration={0.6}
				>
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
				</MotionReveal>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionReveal
						className="section-header centered"
						y={24}
						duration={0.7}
					>
						<p className="section-eyebrow">How we work</p>
						<h2>Values that shape every project.</h2>
					</MotionReveal>
					<MotionStagger className="values-grid" staggerDelay={0.08}>
						<MotionStaggerChild
							as="article"
							className="surface-card value-card reveal-left"
						>
							<div className="value-card-icon" aria-hidden="true">
								⚡
							</div>
							<h3>Speed is respect</h3>
							<p>
								Fast pages respect your visitors' time. Every build ships
								mobile-first, performance-tuned, and scored against Google's own
								report card before launch.
							</p>
						</MotionStaggerChild>
						<MotionStaggerChild
							as="article"
							className="surface-card value-card reveal-up"
						>
							<div className="value-card-icon" aria-hidden="true">
								🎯
							</div>
							<h3>One builder, end to end</h3>
							<p>
								Strategy, design, code, SEO, and support — one person
								accountable for the entire project. No handoff chain, no mystery
								subcontractors.
							</p>
						</MotionStaggerChild>
						<MotionStaggerChild
							as="article"
							className="surface-card value-card reveal-right"
						>
							<div className="value-card-icon" aria-hidden="true">
								🛡️
							</div>
							<h3>Veteran discipline</h3>
							<p>
								Marine Corps–trained attention to detail. Deadlines are
								commitments, communication is direct, and nothing ships until it
								meets the standard.
							</p>
						</MotionStaggerChild>
						<MotionStaggerChild
							as="article"
							className="surface-card value-card reveal-up"
						>
							<div className="value-card-icon" aria-hidden="true">
								🔑
							</div>
							<h3>You own the code</h3>
							<p>
								When you pay for a site, you own it — source code, assets, all
								of it. No hostage fees, no takedowns. The monthly plan is for
								SEO and hosting, not for keeping your site alive.
							</p>
						</MotionStaggerChild>
					</MotionStagger>
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
				<MotionReveal
					className="section-container marketing-cta-row reveal-up"
					y={20}
					duration={0.6}
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className={btnPrimary}>
						Let&apos;s build something great.
					</Link>
					<Link href="/lighthouse" className={btnSecondaryProof}>
						Audit My Site
					</Link>
				</MotionReveal>
			</section>
		</MarketingChrome>
	);
}

export function PricingPage() {
	const copy = staticMarketingPageCopy.pricing;
	const pricingCatalog = buildPricingOfferCatalogSchema();
	const vaultSoftware = buildVaultCrmSoftwareApplicationSchema();
	const pricingFaqSchema = buildFaqPageSchema([...pricingFaqEntries], {
		path: "/pricing",
	});
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
				// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
				dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingCatalog) }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
				dangerouslySetInnerHTML={{ __html: JSON.stringify(vaultSoftware) }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
				dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
			/>
			<PageHero
				kind="pricing"
				title="Pricing"
				subtitle="Easy payments at launch, three months of hosting + SEO included, then optional Growth Plan."
			/>
			<section className="section-shell">
				<MotionReveal
					className="section-container marketing-prose"
					y={16}
					duration={0.6}
				>
					<p className="reveal-up">
						{PUBLIC_STANDARD_PAYMENT_PLAN} {PUBLIC_LAUNCH_BUNDLE_COPY} When the
						build is done, you own the source code — no lock-in, no takedown if
						you leave. Book a short intro call for a written estimate tailored
						to your pages, integrations, and SEO depth.
					</p>
				</MotionReveal>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionStagger className="pricing-tiers" staggerDelay={0.08}>
						<MotionStaggerChild
							as="article"
							className="surface-card pricing-tier reveal-left"
						>
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
								<li>Contact form with server-side validation</li>
								<li>Lighthouse performance tuning</li>
								<li>Full source code handed to you at launch</li>
								<li>{BESPOKE_CONFIG_LABEL}</li>
							</ul>
						</MotionStaggerChild>
						<MotionStaggerChild
							as="article"
							className="surface-card pricing-tier pricing-tier--featured reveal-scale"
						>
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
								<li>{BESPOKE_CONFIG_LABEL}</li>
							</ul>
						</MotionStaggerChild>
						<MotionStaggerChild
							as="article"
							className="surface-card pricing-tier reveal-right"
						>
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
								<li>{BESPOKE_CONFIG_LABEL}</li>
							</ul>
						</MotionStaggerChild>
					</MotionStagger>
				</div>
			</section>
			<section className="section-shell">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionReveal
						className="section-header centered"
						y={24}
						duration={0.7}
					>
						<p className="section-eyebrow">Founding partner program</p>
						<h2>Or skip the build cost entirely.</h2>
						<p>
							{FOUNDING_PARTNER_BUILD_SLOTS} founding partner spots pair a
							complimentary custom build with the {FOUNDING_PARTNER_SEO_MONTHLY}
							/mo {FOUNDING_PARTNER_SEO_LABEL} — hosting, security, and SEO
							included.
						</p>
					</MotionReveal>
					<MotionReveal
						className="marketing-cta-row reveal-up"
						y={20}
						duration={0.6}
						style={{ justifyContent: "center" }}
					>
						<Link href="/contact" className={btnPrimary}>
							Let&apos;s build something great.
						</Link>
						<Link href="/lighthouse" className={btnOutline}>
							Audit My Site
						</Link>
					</MotionReveal>
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
				kind="edge"
				title="Our Edge"
				subtitle="Why our sites feel different — performance, structure, and long-term maintainability."
			/>
			<section className="section-shell">
				<MotionReveal
					className="section-container marketing-prose"
					y={16}
					duration={0.6}
				>
					<p className="reveal-up">
						We build lean, fast marketing sites with modern tooling so you are
						not fighting plugins, template drift, or mystery bloat six months
						after launch.
					</p>
				</MotionReveal>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionReveal
						className="section-header centered"
						y={24}
						duration={0.7}
					>
						<h2>Template builders vs. a custom build.</h2>
						<p>
							The difference shows up in speed, search placement, and what
							breaks next month.
						</p>
					</MotionReveal>
					<MotionStagger className="comparison-grid" staggerDelay={0.08}>
						<MotionStaggerChild className="surface-card comparison-column comparison-column--them reveal-left">
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
						</MotionStaggerChild>
						<MotionStaggerChild className="surface-card comparison-column comparison-column--us reveal-right">
							<span className="comparison-label">ANTHONY.</span>
							<ul className="comparison-list">
								<li>Zero plugin dependencies</li>
								<li>Sub-second load on mobile networks</li>
								<li>Custom layout tuned for your business</li>
								<li>SEO baked into the architecture from day one</li>
								<li>Nothing to patch — less to break</li>
								<li>Direct line to the builder</li>
								<li>You own the code — it never gets taken down</li>
							</ul>
						</MotionStaggerChild>
					</MotionStagger>
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
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionReveal
						className="section-header centered"
						y={24}
						duration={0.7}
					>
						<h2>The stack.</h2>
						<p>
							Modern tooling chosen for speed, stability, and longevity — not
							defaults inherited from a template.
						</p>
					</MotionReveal>
					<MotionStagger className="stack-grid" staggerDelay={0.08}>
						<MotionStaggerChild className="surface-card stack-col reveal-up">
							<span className="stack-col-label">Rendering</span>
							<div className="stack-chips">
								{[
									{ label: "Next.js 16", href: "https://nextjs.org" },
									{ label: "React 19", href: "https://react.dev" },
									{
										label: "TypeScript",
										href: "https://www.typescriptlang.org",
									},
									{ label: "esbuild", href: "https://esbuild.github.io" },
								].map(({ label, href }) => (
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
						</MotionStaggerChild>
						<MotionStaggerChild className="surface-card stack-col reveal-up">
							<span className="stack-col-label">Styling &amp; Motion</span>
							<div className="stack-chips">
								{[
									{ label: "Tailwind v4", href: "https://tailwindcss.com" },
									{
										label: "Framer Motion",
										href: "https://www.framer.com/motion/",
									},
									{ label: "GSAP", href: "https://gsap.com" },
									{
										label: "Variable Fonts",
										href: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide",
									},
								].map(({ label, href }) => (
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
						</MotionStaggerChild>
						<MotionStaggerChild className="surface-card stack-col reveal-up">
							<span className="stack-col-label">Infrastructure &amp; AI</span>
							<div className="stack-chips">
								{[
									{
										label: "Cloudflare Pages",
										href: "https://pages.cloudflare.com",
									},
									{
										label: "Cloudflare Workers",
										href: "https://workers.cloudflare.com",
									},
									{ label: "ElysiaJS", href: "https://elysiajs.com" },
									{
										label: "Gemini 2.0",
										href: "https://deepmind.google/technologies/gemini/",
									},
									{ label: "Zod", href: "https://zod.dev" },
								].map(({ label, href }) => (
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
						</MotionStaggerChild>
					</MotionStagger>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<MotionReveal
					className="section-container marketing-cta-row reveal-up"
					y={20}
					duration={0.6}
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className={btnOutline}>
						Contact us for your free audit
					</Link>
					<Link href="/services" className={btnSecondaryProof}>
						View services
					</Link>
				</MotionReveal>
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
				// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
			/>
			<PageHero
				kind="faq"
				title="FAQ"
				subtitle="Quick answers before you spend a dollar."
			/>
			<section className="section-shell">
				<div className="section-container">
					<MotionStagger
						className="home-faq-list"
						staggerDelay={0.08}
						data-exclusive-details
					>
						{homeFaqEntries.map((entry) => (
							<MotionStaggerChild
								as="details"
								key={entry.question}
								className="text-bubble is-bordered home-faq-item reveal-up"
							>
								<FaqAccordionSummaryAndAnswer {...entry} />
							</MotionStaggerChild>
						))}
					</MotionStagger>
					<MotionReveal
						className="marketing-cta-row reveal-up"
						y={20}
						duration={0.6}
						style={{
							justifyContent: "center",
							marginTop: "clamp(2rem, 4vw, 3rem)",
						}}
					>
						<Link href="/contact" className={btnOutline}>
							Still have a question? Contact us
						</Link>
						<Link href="/contact" className={btnOutline}>
							Contact us for your free audit
						</Link>
					</MotionReveal>
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
				kind="service-areas"
				title="Service Areas"
				subtitle="Mohawk Valley, Central NY, and select national markets."
			/>
			<section className="section-shell">
				<MotionReveal
					className="section-container marketing-prose"
					y={16}
					duration={0.6}
				>
					<p className="reveal-up">
						Primary work is anchored in Rome, NY, with regular coverage across
						Utica, Syracuse, and the broader Mohawk Valley. We also support
						select remote clients on a case-by-case basis.
					</p>
				</MotionReveal>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<MotionStagger
						className="service-area-signal-strip reveal-up"
						staggerDelay={0.08}
					>
						<MotionStaggerChild className="surface-card service-area-signal">
							<span className="service-area-signal__label">Core Markets</span>
							<span className="service-area-signal__value">
								{coreMarketCount}
							</span>
						</MotionStaggerChild>
						<MotionStaggerChild className="surface-card service-area-signal">
							<span className="service-area-signal__label">Remote Markets</span>
							<span className="service-area-signal__value">
								{remoteMarketCount}
							</span>
						</MotionStaggerChild>
						<MotionStaggerChild className="surface-card service-area-signal">
							<span className="service-area-signal__label">
								Response Window
							</span>
							<span className="service-area-signal__value">1 Business Day</span>
						</MotionStaggerChild>
					</MotionStagger>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionStagger className="region-grid" staggerDelay={0.08}>
						{serviceAreaLocations.map((r) => (
							<MotionStaggerChild as="div" key={r.slug}>
								<Link
									href={`/service-areas/${r.slug}`}
									className="surface-card region-card region-card-link reveal-up"
								>
									<span
										className={`region-card-tag ${r.cardBadge ? "region-card-tag--bronze" : `region-card-tag--${r.tag}`}`}
									>
										{r.cardBadge ??
											(r.tag === "primary" ? "Core market" : "Remote")}
									</span>
									<h3>{r.name}</h3>
									<p>{r.cardTeaser}</p>
									<span className="region-card-more">
										Local web design guide →
									</span>
								</Link>
							</MotionStaggerChild>
						))}
					</MotionStagger>
				</div>
			</section>
			{longform.map((section) => (
				<section
					key={section.heading}
					className="section-shell section-shell--longform"
				>
					<MotionReveal
						className="section-container marketing-prose marketing-prose--longform"
						y={16}
						duration={0.6}
					>
						<div className="section-divider-glow" aria-hidden="true" />
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p) => (
							<p key={p} className="reveal-up">
								{p}
							</p>
						))}
					</MotionReveal>
				</section>
			))}
			<section className="section-shell">
				<MotionReveal
					className="section-container marketing-cta-row reveal-up"
					y={20}
					duration={0.6}
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className={btnOutline}>
						Contact the studio
					</Link>
					<Link href="/contact" className={btnOutline}>
						Contact us for your free audit
					</Link>
				</MotionReveal>
			</section>
		</MarketingChrome>
	);
}

const SERVICE_AREA_FAQ_ENTRIES = [
	{
		question: "How long does a new website build take?",
		answer:
			"Most projects ship in four to six weeks from signed proposal. Complex builds with custom integrations may take longer — we scope that upfront so there are no surprises.",
	},
	{
		question: "Do you handle local SEO or just the website?",
		answer:
			"Both. Every build includes on-page SEO foundations — heading hierarchy, schema markup, page speed, and mobile responsiveness. Monthly local SEO plans (GBP management, citation building, review strategy) are available as an add-on.",
	},
	{
		question: "What if I already have a site but it just needs help?",
		answer:
			"We offer rescue engagements — we audit the existing site, fix what we can, and recommend a targeted plan. If the platform is too far gone, we'll say so and quote a rebuild.",
	},
	{
		question: "Do I own the site when it's done?",
		answer:
			"Yes. You own the code, the domain, and the hosting account. We set everything up so you can move to another provider if you ever want to — no vendor lock-in.",
	},
];

export function ServiceAreaLocationPage({ slug }: { slug: string }) {
	const loc = getServiceAreaLocation(slug);
	if (!loc) {
		notFound();
	}

	const pathname = `/service-areas/${loc.slug}`;
	const crumbs = buildBreadcrumbs(pathname, loc.name);
	const otherAreas = serviceAreaLocations.filter((a) => a.slug !== loc.slug);
	/* Phase-3 #26: per-area detail pages use the depth-only longform so the
	   shared "Strategy before design" block doesn't duplicate across cities. */
	const longform = getServiceAreaDetailLongformSections(loc.name);

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
				kind="service-areas"
				title={`Web design & local SEO — ${loc.name}`}
				subtitle={loc.heroSubtitle}
			/>
			<section className="section-shell">
				<MotionReveal
					className="section-container marketing-prose"
					y={16}
					duration={0.6}
				>
					{loc.intro.map((p) => (
						<p key={p} className="reveal-up">
							{p}
						</p>
					))}
				</MotionReveal>
			</section>
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<MotionReveal
						className="local-context-chips reveal-up"
						y={20}
						duration={0.6}
					>
						<span className="local-context-chip">
							{loc.tag === "primary" ? "Core Market" : "Remote Market"}
						</span>
						<span className="local-context-chip">Mobile-First Build</span>
						<span className="local-context-chip">Local SEO Included</span>
						<span className="local-context-chip">Manual Launch QA</span>
					</MotionReveal>
				</div>
			</section>
			{loc.sections.map((section) => (
				<section
					key={section.heading}
					className="section-shell section-shell--wash"
				>
					<MotionReveal
						className="section-container marketing-prose"
						y={16}
						duration={0.6}
					>
						<div className="section-divider-glow" aria-hidden="true" />
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p) => (
							<p key={p} className="reveal-up">
								{p}
							</p>
						))}
					</MotionReveal>
				</section>
			))}
			{longform.map((section) => (
				<section
					key={section.heading}
					className="section-shell section-shell--longform"
				>
					<MotionReveal
						className="section-container marketing-prose marketing-prose--longform"
						y={16}
						duration={0.6}
					>
						<div className="section-divider-glow" aria-hidden="true" />
						<h2 className="reveal-up">{section.heading}</h2>
						{section.paragraphs.map((p) => (
							<p key={p} className="reveal-up">
								{p}
							</p>
						))}
					</MotionReveal>
				</section>
			))}
			{/* FAQ accordion */}
			<section className="section-shell section-shell--wash">
				<div className="section-container">
					<MotionReveal
						className="section-header centered"
						y={24}
						duration={0.7}
					>
						<p className="section-eyebrow">Common questions</p>
						<h2>FAQ — {loc.name}</h2>
					</MotionReveal>
					<MotionStagger
						className="home-faq-list"
						staggerDelay={0.08}
						data-exclusive-details
					>
						{SERVICE_AREA_FAQ_ENTRIES.map((entry) => (
							<MotionStaggerChild
								as="details"
								key={entry.question}
								className="text-bubble is-bordered home-faq-item reveal-up"
							>
								<FaqAccordionSummaryAndAnswer {...entry} />
							</MotionStaggerChild>
						))}
					</MotionStagger>
				</div>
			</section>
			<section className="section-shell">
				<div className="section-container">
					<div className="section-divider-glow" aria-hidden="true" />
					<MotionReveal
						className="section-header centered"
						y={24}
						duration={0.7}
					>
						<p className="section-eyebrow">More areas</p>
						<h2>Other markets we serve</h2>
						<p className="page-lead reveal-up">
							Each page explains how we approach web design and local SEO in
							that market — browse another city or{" "}
							<Link href="/service-areas">return to the full list</Link>.
						</p>
					</MotionReveal>
					<MotionStagger className="region-grid" staggerDelay={0.08}>
						{otherAreas.map((r) => (
							<MotionStaggerChild key={r.slug}>
								<Link
									href={`/service-areas/${r.slug}`}
									className="surface-card region-card region-card-link reveal-up"
								>
									<span
										className={`region-card-tag ${r.cardBadge ? "region-card-tag--bronze" : `region-card-tag--${r.tag}`}`}
									>
										{r.cardBadge ??
											(r.tag === "primary" ? "Core market" : "Remote")}
									</span>
									<h3>{r.name}</h3>
									<p>{r.cardTeaser}</p>
									<span className="region-card-more">
										Read the local guide →
									</span>
								</Link>
							</MotionStaggerChild>
						))}
					</MotionStagger>
				</div>
			</section>
			<section className="section-shell section-shell--wash">
				<MotionReveal
					className="section-container marketing-cta-row reveal-up"
					y={20}
					duration={0.6}
					style={{ justifyContent: "center" }}
				>
					<Link href="/contact" className={btnOutline}>
						Contact the studio
					</Link>
					<Link href="/contact" className={btnOutline}>
						Contact us for your free audit
					</Link>
				</MotionReveal>
			</section>
		</MarketingChrome>
	);
}
