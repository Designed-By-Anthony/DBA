import { showcaseFeaturedItems } from "@/data/showcase";
import {
	homeFaqEntries,
	processSteps,
	whyStackCards,
} from "@/data/home";
import {
	FOUNDING_PARTNER_BUILD_SLOTS,
	FOUNDING_PARTNER_SEO_LABEL,
	FOUNDING_PARTNER_SEO_MONTHLY,
	STANDARD_WEBSITE_STARTING_PRICE,
	STANDARD_WEBSITE_TYPICAL_RANGE,
} from "@/lib/offers";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { AuditForm } from "./AuditForm";
import { FoundingPartnerSection } from "./FoundingPartnerSection";
import { PremiumPitchStrip } from "./PremiumPitchStrip";
import "@/app/home-page.css";

const homeFeaturedWorkItems = showcaseFeaturedItems.slice(0, 3);

const heroVariants = {
	wellness: {
		eyebrow:
			"Mohawk Valley Web Design Studio · Medspa · Salon · Wellness · Boutique",
		h1: "Mohawk Valley web design for wellness brands that want a site as polished as the client experience.",
		sub: "Custom websites for medspas, salons, aesthetic clinics, and boutique wellness brands across Utica, Rome, Syracuse, and Central New York. Editorial layouts, luxurious typography, and a booking flow that respects your brand — so the site feels like an extension of the treatment room, not a template from 2014. See where your current site stands with a free 60-second audit.",
	},
	"multi-location": {
		eyebrow:
			"Central NY Web Design Studio · Multi-Location · Franchise · HVAC · Home Services",
		h1: "Web design and local SEO for multi-location service businesses across Central New York.",
		sub: "Custom sites for HVAC, plumbing, electrical, and home-service operators running two, three, or more locations across Utica, Syracuse, Watertown, and greater Upstate NY. Distinct location pages, shared lead capture, CRM integration (ServiceTitan, Jobber, Housecall Pro), and local SEO tuned for each market. See where your current site stands with a free 60-second audit.",
	},
} as const;

export function HomePage() {
	return (
		<>
			<section className="page-hero page-hero--home">
				<div className="hero-rain" aria-hidden="true">
					<span className="hero-rain__layer hero-rain__layer--back" />
					<span className="hero-rain__layer hero-rain__layer--front" />
				</div>
				<div className="page-hero-inner">
					<div className="hero-copy">
						<p className="hero-place-marker" aria-label="Area codes three one five and five one eight">
							<span className="hero-place-marker__rule" aria-hidden="true" />
							<span className="hero-place-marker__text">315 · 518</span>
						</p>
						<p className="page-eyebrow page-eyebrow--rule" data-hero-eyebrow>
							Mohawk Valley Web Design Studio · Utica · Rome · Syracuse · CNY
						</p>
						<div className="hero-launch-pill" role="status">
							<span className="hero-launch-dot" aria-hidden="true" />
							<span>
								<strong>{FOUNDING_PARTNER_BUILD_SLOTS} launch pilot spots</strong> · complimentary
								build + {FOUNDING_PARTNER_SEO_MONTHLY}/mo growth plan
							</span>
						</div>
						<h1 data-hero-h1>
							Mohawk Valley web design for service businesses that want a site that actually books
							work.
						</h1>
						<p data-hero-sub>
							Custom websites for contractors, home-service pros, medspas, salons, boutiques, and
							every other small business across Utica, Rome, Syracuse, and greater Central New York.
							Fast on a phone, friendly to read, and built so people searching for what you do
							actually land, trust you, and call. See where your current site stands with a free
							60-second audit.
						</p>
						<p className="hero-pricing-anchor">
							Most local rebuilds land in the <strong>{STANDARD_WEBSITE_TYPICAL_RANGE}</strong>{" "}
							range. Founding-partner pilot pairs a <strong>complimentary build</strong> with a{" "}
							{FOUNDING_PARTNER_SEO_MONTHLY}/mo {FOUNDING_PARTNER_SEO_LABEL} while any of the{" "}
							{FOUNDING_PARTNER_BUILD_SLOTS} launch spots remain. Simple single-service sites still
							start at {STANDARD_WEBSITE_STARTING_PRICE}.
						</p>
						<div className="hero-actions">
							<a
								href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
								className="btn btn-primary-book hero-cta-glow"
								id="hero-founder-btn"
								data-calendar-link
							>
								<span className="hero-cta-glow-halo" aria-hidden="true" />
								Book a 15-minute intro call
							</a>
							<Link href="/free-seo-audit" className="btn btn-primary-audit" id="hero-run-audit-btn">
								Or run the free 60-second audit
							</Link>
						</div>
						<div className="hero-trust-strip reveal-up">
							<div className="hero-trust-badge">
								<span>Free · 60-Second Report</span>
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

			<section className="section-shell section-shell--proof command-shell">
				<div className="section-container command-strip reveal-up" aria-label="How this studio works">
					<div className="command-strip__item command-strip__item--brand">
						<p className="command-strip__label">Who builds it</p>
						<p className="command-strip__value">One person, end to end</p>
						<p className="command-strip__meta">
							You talk to the same builder from first call to launch — structure, copy, and
							performance, not a handoff chain.
						</p>
					</div>
					<div className="command-strip__item">
						<p className="command-strip__label">How we start</p>
						<p className="command-strip__value">Audit, then a plan</p>
						<p className="command-strip__meta">
							We run the numbers first so the quote matches what your site actually needs — not a
							guess from a sales call.
						</p>
					</div>
					<div className="command-strip__item">
						<p className="command-strip__label">What we optimize for</p>
						<p className="command-strip__value">Real calls, not vanity</p>
						<p className="command-strip__meta">
							Clear next steps on every page so the right visitors know how to reach you — and you
							are not chasing junk leads.
						</p>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--wash home-proof-shell" aria-labelledby="home-proof-heading">
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Proof so far</p>
						<h2 id="home-proof-heading">Where things stand today — no fluff.</h2>
						<p>
							We are still in the first 10-client launch pilot. Here is what we can honestly point
							to right now.
						</p>
					</div>
					<div className="home-proof-grid">
						<article className="surface-card home-proof-card reveal-up">
							<span className="card-tag">Verified technical baseline</span>
							<h3>Lighthouse performance and quality scores are consistently strong.</h3>
							<p>
								The site showcases real Lighthouse results and the same engineering standards used
								in client builds: fast loading, clean accessibility, and solid technical SEO
								structure.
							</p>
						</article>
						<article className="surface-card home-proof-card reveal-up">
							<span className="card-tag">Current client outcome</span>
							<h3>The Long Beach Handyman is live; lead generation is still in progress.</h3>
							<p>
								The first client paid $250 for the build and the site is deployed. Paid advertising
								has not produced a customer yet, so we are treating this as an early-stage
								baseline and continuing to test positioning and traffic.
							</p>
						</article>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--wash home-quick-lead" aria-labelledby="home-quick-heading">
				<div className="section-container">
					<div className="home-quick-lead__card surface-card reveal-up">
						<h2 id="home-quick-heading" className="home-quick-lead__title">
							Quick question?
						</h2>
						<p className="home-quick-lead__sub">
							Same secure lead path as the <Link href="/contact">contact page</Link> — compact so
							the hero stays clean.
						</p>
						<AuditForm
							ctaSource="home_quick"
							pageContext="homepage"
							sourcePath="/"
							offerType="home_page_contact"
							subjectLine="Homepage quick contact — Designed by Anthony"
							successTitle="Got it"
							successMessage="Anthony will follow up within 24 hours — same workflow as the full contact form."
							successPoints={[
								"We will reply with a clear next step.",
								"Book a call anytime from the site header if you prefer.",
							]}
							successTag="Message received"
							submitLabel="Send"
							metaMessage="Turnstile-protected. No spam."
							websiteRequired={false}
							issueRequired={false}
							issueLabel="Message (optional)"
							issuePlaceholder="What should we know?"
							issueRows={2}
							showPhoneField={false}
						/>
					</div>
				</div>
			</section>

			<section className="section-shell section-shell--wash why-astro-shell" aria-labelledby="why-stack-heading">
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Why our sites feel different</p>
						<h2 id="why-stack-heading">
							The technical stuff is the boring part. Here is what it actually means for your
							business.
						</h2>
						<p>
							Instead of a WordPress site held together with a pile of plugins, you get a lean site
							that stays fast — fewer moving parts, less to patch, and nothing that quietly breaks
							while you are out on a job.
						</p>
					</div>
					<div className="why-astro-grid">
						{whyStackCards.map((card) => (
							<article key={card.tech} className="surface-card why-astro-card reveal-up">
								<span className="why-astro-tech">{card.tech}</span>
								<h3 className="why-astro-plain">{card.plain}</h3>
								<p className="why-astro-why">{card.why}</p>
							</article>
						))}
					</div>
					<p className="why-astro-cta-note">
						Want the full technical breakdown with benchmarks and sources?{" "}
						<Link href="/ouredge" className="inline-link">
							See our technical edge →
						</Link>
					</p>
				</div>
			</section>

			<section className="section-shell home-faq-shell" aria-labelledby="home-faq-heading">
				<div className="section-container">
					<div className="section-header centered">
						<p className="section-eyebrow">Quick Answers</p>
						<h2 id="home-faq-heading">Questions we hear most from local owners.</h2>
						<p>
							Pricing, timelines, and how this actually works — in plain language, before you spend a
							dollar.
						</p>
					</div>
					<div className="home-faq-list">
						{homeFaqEntries.map((entry) => (
							<details key={entry.question} className="surface-card home-faq-item reveal-up">
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
						<p className="section-eyebrow section-eyebrow--pulse">How It Works</p>
						<h2>From free audit to live site — without the runaround.</h2>
						<p>No pressure to commit on the first call. Here is how it goes from your first click to launch.</p>
					</div>

					<div className="process-grid process-grid--asymmetric">
						{processSteps.map((step, index) => (
							<div key={step.title} className="surface-card surface-card--technical process-card reveal-up">
								<span className="process-number">0{index + 1}</span>
								<h3>{step.title}</h3>
								<p>{step.description}</p>
							</div>
						))}
					</div>

					<div className="process-action">
						<Link href="/free-seo-audit" className="btn btn-primary-audit">
							Run the Free Audit
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
							Finished work shows the layout, structure, and conversion thinking we bring to every
							build.{" "}
							<Link href="/ouredge" className="inline-link">
								See our technical edge →
							</Link>
						</p>
					</div>

					<div className="featured-work-grid featured-work-grid--stagger" data-home-featured-work>
						{homeFeaturedWorkItems.map((item, i) => {
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
										<div className="featured-image-wrap">
											<Image
												src={imgSrc}
												alt={item.imageAlt ?? item.name}
												className="featured-image"
												width={640}
												height={480}
												sizes="(max-width: 900px) min(100vw, 1160px), min(33vw, 480px)"
												priority={i === 0}
												{...(i === 0 ? { fetchPriority: "high" as const } : {})}
											/>
										</div>
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
											{isExternal && <span className="sr-only">(opens in new window)</span>}
										</a>
									</div>
								</article>
							);
						})}
					</div>

					<div className="portfolio-link-wrap">
						<Link href="/portfolio" className="btn btn-secondary-proof">
							View Full Portfolio
						</Link>
					</div>
				</div>
			</section>

			<Script id="hero-variants" strategy="afterInteractive">
				{`(() => {
  try {
    var params = new URLSearchParams(window.location.search);
    var variantKey = params.get('v');
    var heroVariants = ${JSON.stringify(heroVariants)};
    if (variantKey && heroVariants && heroVariants[variantKey]) {
      var variant = heroVariants[variantKey];
      var eyebrow = document.querySelector('[data-hero-eyebrow]');
      var h1 = document.querySelector('[data-hero-h1]');
      var sub = document.querySelector('[data-hero-sub]');
      if (eyebrow && variant.eyebrow) eyebrow.textContent = variant.eyebrow;
      if (h1 && variant.h1) h1.textContent = variant.h1;
      if (sub && variant.sub) sub.textContent = variant.sub;
      document.documentElement.setAttribute('data-hero-variant', variantKey);
    }
  } catch (e) {}
})();`}
			</Script>

			<Script id="home-hero-motion" strategy="afterInteractive">
				{`(() => {
  var hero = document.querySelector('.page-hero--home');
  if (!hero) return;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!prefersReducedMotion && hasFinePointer) {
    hero.addEventListener('pointermove', function (event) {
      var rect = hero.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--hero-spot-x', x.toFixed(2) + '%');
      hero.style.setProperty('--hero-spot-y', y.toFixed(2) + '%');
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--hero-spot-x', '50%');
      hero.style.setProperty('--hero-spot-y', '22%');
    });
  }
  var actionButtons = hero.querySelectorAll('.hero-actions .btn');
  if (prefersReducedMotion || !hasFinePointer || actionButtons.length === 0) return;
  var MAX_SHIFT = 8;
  actionButtons.forEach(function (button) {
    button.addEventListener('pointermove', function (event) {
      var rect = button.getBoundingClientRect();
      var dx = event.clientX - (rect.left + rect.width / 2);
      var dy = event.clientY - (rect.top + rect.height / 2);
      var xShift = (dx / (rect.width / 2)) * MAX_SHIFT;
      var yShift = (dy / (rect.height / 2)) * MAX_SHIFT;
      button.style.setProperty('--btn-shift-x', xShift.toFixed(2) + 'px');
      button.style.setProperty('--btn-shift-y', yShift.toFixed(2) + 'px');
    }, { passive: true });
    button.addEventListener('pointerleave', function () {
      button.style.setProperty('--btn-shift-x', '0px');
      button.style.setProperty('--btn-shift-y', '0px');
    });
  });
})();`}
			</Script>
		</>
	);
}
