import Image from "next/image";
import Link from "next/link";
import { homeFaqEntries, processSteps, whyStackCards } from "@/data/home";
import { showcaseFeaturedItems } from "@/data/showcase";
import {
	btnOutline,
	btnPrimary,
	btnSecondaryProof,
} from "@/design-system/buttons";
import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	STANDARD_WEBSITE_INSTALLMENT_EACH,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "@/lib/offers";
import { FoundingPartnerSection } from "./FoundingPartnerSection";
import { PremiumPitchStrip } from "./PremiumPitchStrip";

const homeFeaturedWorkItems = showcaseFeaturedItems.slice(0, 3);

export function HomePage() {
	return (
		<>
			<section className="page-hero page-hero--home">
				<div className="page-hero-inner">
					<div className="hero-copy">
						<p className="page-eyebrow page-eyebrow--rule" data-hero-eyebrow>
							Mohawk Valley Digital Agency · Utica · Rome · Syracuse · CNY
						</p>
						<div className="hero-launch-pill" role="status">
							<span className="hero-launch-dot" aria-hidden="true" />
							<span>
								<strong>
									{FOUNDING_PARTNER_BUILD_SLOTS} launch pilot spots
								</strong>{" "}
								· complimentary build + {FOUNDING_PARTNER_SEO_MONTHLY}/mo growth
								plan
							</span>
						</div>
						<h1 data-hero-h1>
							Strategic web design for service businesses that demand measurable
							growth and lasting market presence.
						</h1>
						<p data-hero-sub>
							Enterprise-grade websites for contractors, home-service
							professionals, medical aesthetics, salons, and scaling businesses
							throughout Utica, Rome, Syracuse, and Central New York.
							Performance-optimized architecture, conversion-focused design, and
							SEO infrastructure that positions you at the top of local search
							results.
						</p>
						<p className="hero-pricing-anchor">
							Standard engagements:{" "}
							<strong>
								3 quarterly payments of {STANDARD_WEBSITE_INSTALLMENT_EACH}
							</strong>{" "}
							(investment typically {STANDARD_WEBSITE_TYPICAL_RANGE}) — includes
							enterprise hosting and strategic SEO for the first quarter, then
							continue with the {FOUNDING_PARTNER_SEO_MONTHLY}/mo{" "}
							{FOUNDING_PARTNER_SEO_LABEL}. Founding partner program:
							complimentary build with SEO commitment —{" "}
							{FOUNDING_PARTNER_BUILD_SLOTS} exclusive positions available.
							Single-service solutions from {STANDARD_WEBSITE_STARTING_PRICE}.
						</p>
						<div className="hero-actions">
							<Link
								href="/lighthouse"
								className={`${btnPrimary} hero-cta-glow`}
								id="hero-audit-btn"
							>
								<span className="hero-cta-glow-halo" aria-hidden="true" />
								Audit My Site
							</Link>
							<Link
								href="/contact"
								className={btnOutline}
								id="hero-contact-btn"
							>
								Contact us
							</Link>
						</div>
						<div className="hero-trust-strip">
							<div className="hero-trust-badge">
								<span>Free · Manual Audit</span>
							</div>
							<span className="hero-trust-sep" aria-hidden="true" />
							<div className="hero-trust-badge">
								<span>Built in Rome, NY</span>
							</div>
							<span className="hero-trust-sep" aria-hidden="true" />
							<div className="hero-trust-badge">
								<span>Reply in 1 Business Day</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--premium-pitch">
				<PremiumPitchStrip variant="home" />
			</section>

			<section
				className="section-shell section-shell--proof command-shell"
				aria-label="How this studio works"
			>
				<div className="section-container command-strip reveal-up">
					<div className="command-strip__item command-strip__item--brand">
						<p className="command-strip__label">Who builds it</p>
						<p className="command-strip__value">One person, end to end</p>
						<p className="command-strip__meta">
							You talk to the same builder from first call to launch —
							structure, copy, and performance, not a handoff chain.
						</p>
					</div>
					<div className="command-strip__item">
						<p className="command-strip__label">How we start</p>
						<p className="command-strip__value">Audit, then a plan</p>
						<p className="command-strip__meta">
							We run the numbers first so the quote matches what your site
							actually needs — not a guess from a sales call.
						</p>
					</div>
					<div className="command-strip__item">
						<p className="command-strip__label">What we optimize for</p>
						<p className="command-strip__value">Real calls, not vanity</p>
						<p className="command-strip__meta">
							Clear next steps on every page so the right visitors know how to
							reach you — and you are not chasing junk leads.
						</p>
					</div>
				</div>
			</section>

			<section
				className="section-shell section-shell--wash home-proof-shell"
				aria-labelledby="home-proof-heading"
			>
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Proof so far</p>
						<h2 id="home-proof-heading">
							Where things stand today — no fluff.
						</h2>
						<p>
							We are still in the first 10-client launch pilot. Here is what we
							can honestly point to right now.
						</p>
					</div>
					<div className="home-proof-grid">
						<article className="surface-card home-proof-card reveal-up">
							<span className="card-tag">Verified technical baseline</span>
							<h3>
								Lighthouse performance and quality scores are consistently
								strong.
							</h3>
							<p>
								The site showcases real Lighthouse results and the same
								engineering standards used in client builds: fast loading, clean
								accessibility, and solid technical SEO structure.
							</p>
						</article>
						<article className="surface-card home-proof-card reveal-up">
							<span className="card-tag">Current client outcome</span>
							<h3>
								The Long Beach Handyman is live; lead generation is still in
								progress.
							</h3>
							<p>
								The first client paid $250 for the build and the site is
								deployed. Paid advertising has not produced a customer yet, so
								we are treating this as an early-stage baseline and continuing
								to test positioning and traffic.
							</p>
						</article>
					</div>
				</div>
			</section>

			<section
				className="section-shell section-shell--wash home-email-cta"
				aria-labelledby="home-email-cta-heading"
			>
				<div className="section-container">
					<div className="home-email-cta__card surface-card reveal-up">
						<div className="home-email-cta__copy">
							<p className="home-email-cta__eyebrow">Prefer email?</p>
							<h2 id="home-email-cta-heading" className="home-email-cta__title">
								Send a message on the contact page
							</h2>
							<p className="home-email-cta__sub">
								Same secure lead path — full form with optional phone and
								project details. We reply within one business day.
							</p>
						</div>
						<div className="home-email-cta__actions">
							<Link href="/contact" className={btnOutline}>
								Open contact form
							</Link>
							<Link href="/lighthouse" className={btnPrimary}>
								Or run a free site audit
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section
				className="section-shell section-shell--wash why-stack-shell"
				aria-labelledby="why-stack-heading"
			>
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Why our sites feel different</p>
						<h2 id="why-stack-heading">
							The technical stuff is the boring part. Here is what it actually
							means for your business.
						</h2>
						<p>
							Instead of a WordPress site held together with a pile of plugins,
							you get a lean site that stays fast — fewer moving parts, less to
							patch, and nothing that quietly breaks while you are out on a job.
						</p>
					</div>
					<div className="why-stack-grid">
						{whyStackCards.map((card) => (
							<article
								key={card.tech}
								className="surface-card why-stack-card reveal-up"
							>
								<span className="why-stack-tech">{card.tech}</span>
								<h3 className="why-stack-plain">{card.plain}</h3>
								<p className="why-stack-why">{card.why}</p>
							</article>
						))}
					</div>
					<p className="why-stack-cta-note">
						Want the full technical breakdown with benchmarks and sources?{" "}
						<Link href="/ouredge" className="inline-link">
							See our technical edge →
						</Link>
					</p>
				</div>
			</section>

			<section
				className="section-shell home-faq-shell"
				aria-labelledby="home-faq-heading"
			>
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Quick Answers</p>
						<h2 id="home-faq-heading">
							Questions we hear most from local owners.
						</h2>
						<p>
							Pricing, timelines, and how this actually works — in plain
							language, before you spend a dollar.
						</p>
					</div>
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
					<p className="home-faq-cta-note">
						More on process, hosting, and revisions on the{" "}
						<Link href="/faq" className="inline-link">
							full FAQ page
						</Link>
						.
					</p>
				</div>
			</section>

			<FoundingPartnerSection />

			<section className="section-shell section-shell--technical process-shell">
				<div className="section-container">
					<div className="section-flow-marker reveal-up" aria-hidden="true" />
					<div className="section-header centered">
						<p className="section-eyebrow section-eyebrow--pulse">
							How It Works
						</p>
						<h2>From initial audit to live site — without the runaround.</h2>
						<p>
							No pressure to commit on the first call. Here is how it goes from
							your first click to launch.
						</p>
					</div>

					<div className="process-grid process-grid--asymmetric">
						{processSteps.map((step, index) => (
							<div
								key={step.title}
								className="surface-card surface-card--technical process-card reveal-up"
							>
								<span className="process-number">0{index + 1}</span>
								<h3>{step.title}</h3>
								<p>{step.description}</p>
							</div>
						))}
					</div>

					<div className="process-action">
						<Link href="/contact" className={btnOutline}>
							Contact us for your free audit
						</Link>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--editorial section-shell--wash">
				<div className="section-container">
					<div className="section-flow-marker reveal-up" aria-hidden="true" />
					<div className="section-header centered">
						<p className="section-eyebrow">Selected Examples</p>
						<h2>A few sites we have put in front of real customers.</h2>
						<p>
							Finished work shows the layout, structure, and conversion thinking
							we bring to every build.{" "}
							<Link href="/ouredge" className="inline-link">
								See our technical edge →
							</Link>
						</p>
					</div>

					<div
						className="featured-work-grid featured-work-grid--stagger"
						data-home-featured-work
					>
						{homeFeaturedWorkItems.map((item) => {
							const href = item.caseStudySlug
								? `/portfolio/${item.caseStudySlug}`
								: (item.href ?? "#");
							const isExternal = !item.caseStudySlug;
							const ctaLabel = item.caseStudySlug
								? "View Case Study"
								: `Open ${item.name} example`;
							const imgSrc = item.displayImage ?? item.image;
							return (
								<article
									key={item.name}
									className="surface-card surface-card--editorial featured-work-card reveal-up"
								>
									<a
										href={href}
										target={isExternal ? "_blank" : undefined}
										rel={isExternal ? "noopener noreferrer" : undefined}
										className="featured-work-media"
									>
										<Image
											src={imgSrc}
											alt={item.imageAlt ?? item.name}
											width={900}
											height={600}
											className="featured-image"
											sizes="(max-width: 900px) 100vw, 33vw"
										/>
									</a>
									<div className="featured-copy">
										<div className="featured-meta">
											<span className="card-tag">{item.statusLabel}</span>
											<span className="featured-industry">{item.industry}</span>
										</div>
										<h3>{item.name}</h3>
										<p>{item.description}</p>
										<a
											href={href}
											target={isExternal ? "_blank" : undefined}
											rel={isExternal ? "noopener noreferrer" : undefined}
											className="featured-link"
										>
											{ctaLabel}
											{isExternal && (
												<span className="sr-only">(opens in new window)</span>
											)}
										</a>
									</div>
								</article>
							);
						})}
					</div>

					<div className="portfolio-link-wrap">
						<Link href="/portfolio" className={btnSecondaryProof}>
							View Full Portfolio
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
