import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBlocksForSlug } from "@/data/blogArticleBlocks";
import { blogPosts } from "@/data/blogPosts";
import { homeFooterCta } from "@/data/home";
import {
    getBlogLongformSections,
    getServiceDetailLongformSections,
    getServiceLongformSections,
} from "@/data/longformContent";
import { isServiceAreaSlug } from "@/data/serviceAreaLocations";
import { SERVICE_PAGE_EXTRA_SECTIONS } from "@/data/servicePageSections";
import { showcaseItems } from "@/data/showcase";
import { staticMarketingPageCopy } from "@/data/staticMarketingPages";
import {
    btnOutline,
    btnPrimary,
    btnSecondaryProof,
} from "@/design-system/buttons";
import { MARKETING_SERVICES } from "@/lib/seo";
import { ArticleBody } from "./ArticleBody";
import { BlogArticleEnhancements } from "./BlogArticleEnhancements";
import {
    AboutPage,
    FaqPage,
    OurEdgePage,
    PricingPage,
    ServiceAreaLocationPage,
    ServiceAreasPage,
} from "./EnrichedPages";
import { InnerPageMotionSystem } from "./InnerPageMotionSystem";
import { MarketingChrome } from "./MarketingChrome";
import {
    MotionReveal,
    MotionStagger,
    MotionStaggerChild,
} from "./MotionReveal";
import { SalesforceContactForm } from "./SalesforceContactForm";

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
            className="section-shell section-shell--wash marketing-page-hero"
            data-page-kind={kind}
        >
            <InnerPageMotionSystem kind={kind} />
            <div className="section-container">
                <div className="section-header">
                    <h1 className="page-title reveal-up">{title}</h1>
                    {subtitle ? <p className="page-lead reveal-up">{subtitle}</p> : null}
                </div>
            </div>
        </section>
    );
}

function ProseBlock({ paragraphs }: { paragraphs: string[] }) {
    return (
        <section className="section-shell">
            <MotionReveal
                className="section-container marketing-prose"
                y={16}
                duration={0.6}
            >
                {paragraphs.map((p) => (
                    <p key={p} className="reveal-up">
                        {p}
                    </p>
                ))}
            </MotionReveal>
        </section>
    );
}

function ServicesIndex() {
    const longform = getServiceLongformSections("Services");
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero
                kind="services"
                title="Services"
                subtitle="Custom sites, local SEO, hosting, rescues, GBP programs, workspace setup, and AI-assisted lead capture."
            />
            <section className="section-shell section-shell--wash">
                <div className="section-container">
                    <MotionStagger
                        as="ul"
                        className="marketing-link-grid"
                        staggerDelay={0.08}
                    >
                        {MARKETING_SERVICES.map((s) => (
                            <MotionStaggerChild as="li" key={s.path} className="reveal-up">
                                <Link
                                    href={s.path}
                                    className="surface-card marketing-service-card"
                                >
                                    <h2>{s.name}</h2>
                                    <p>{s.description}</p>
                                    <span className="inline-link">Read more →</span>
                                </Link>
                            </MotionStaggerChild>
                        ))}
                    </MotionStagger>
                </div>
            </section>
            
            {longform.map((section) => (
                <section key={section.heading} className="section-shell section-shell--longform">
                    <MotionReveal
                        className="section-container"
                        y={16}
                        duration={0.6}
                    >
                        {/* Apple/Linear Sleek Card Container */}
                        <div className="relative w-full rounded-2xl border border-white/10 bg-[rgb(10_12_18)] p-8 md:p-10 mb-8">
                            <div className="absolute left-1/2 top-0 h-[1px] w-32 -translate-x-1/2 bg-linear-to-r from-transparent via-[rgb(var(--accent-bronze-rgb)/0.8)] to-transparent" />

                            <div className="mb-6 flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--accent-bronze-rgb))]">
                                    Services Strategy
                                </span>
                                <h3 className="font-display text-xl font-medium tracking-tight text-white md:text-2xl">
                                    {section.heading}
                                </h3>
                            </div>

                            <div className="text-bubble is-bordered">
                                {section.paragraphs.map((p, i) => (
                                    <p key={i} className={i > 0 ? "mt-4 text-[0.95rem] text-white/75" : "text-[0.95rem] text-white/75"}>
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </MotionReveal>
                </section>
            ))}
        </MarketingChrome>
    );
}

function ServiceDetailPage({ slug }: { slug: string }) {
    const service = MARKETING_SERVICES.find(
        (s) => s.path === `/services/${slug}`,
    );
    if (!service) notFound();
    const extra = SERVICE_PAGE_EXTRA_SECTIONS[slug];
    /* Phase-3 #26: detail pages use the depth-only longform so the shared
       "Strategy before design" block doesn't duplicate across every service. */
    const longform = getServiceDetailLongformSections(service.name);
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero
                kind="services"
                title={service.name}
                subtitle={service.description}
            />
            <ProseBlock
                paragraphs={[
                    `${service.name} is part of the core offer stack for Mohawk Valley and Central NY service businesses. If this matches what you need, book a short intro call or send a note — we will confirm scope, timeline, and pricing in writing before any work starts.`,
                    "Most projects pair a fast, mobile-first marketing site with clear calls to action, technical SEO structure, and optional ongoing local SEO or managed hosting depending on your goals.",
                ]}
            />
            {extra?.map((section) => (
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
                        {section.bullets?.length ? (
                            <ul className="reveal-up">
                                {section.bullets.map((b) => (
                                    <li key={b}>{b}</li>
                                ))}
                            </ul>
                        ) : null}
                    </MotionReveal>
                </section>
            ))}
            
            {longform.map((section) => (
                <section key={section.heading} className="section-shell section-shell--longform">
                    <MotionReveal
                        className="section-container"
                        y={16}
                        duration={0.6}
                    >
                        {/* Apple/Linear Sleek Card Container */}
                        <div className="relative w-full rounded-2xl border border-white/10 bg-[rgb(10_12_18)] p-8 md:p-10 mb-8">
                            <div className="absolute left-1/2 top-0 h-[1px] w-32 -translate-x-1/2 bg-linear-to-r from-transparent via-[rgb(var(--accent-bronze-rgb)/0.8)] to-transparent" />

                            <div className="mb-6 flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--accent-bronze-rgb))]">
                                    Methodology
                                </span>
                                <h3 className="font-display text-xl font-medium tracking-tight text-white md:text-2xl">
                                    {section.heading}
                                </h3>
                            </div>

                            <div className="text-bubble is-bordered">
                                {section.paragraphs.map((p, i) => (
                                    <p key={i} className={i > 0 ? "mt-4 text-[0.95rem] text-white/75" : "text-[0.95rem] text-white/75"}>
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </MotionReveal>
                </section>
            ))}
            <section className="section-shell section-shell--wash">
                <MotionReveal
                    className="section-container marketing-cta-row reveal-up"
                    y={20}
                    duration={0.6}
                >
                    <Link href="/contact" className={btnPrimary}>
                        Let&apos;s build something great.
                    </Link>
                    <Link href="/lighthouse" className={btnOutline}>
                        Audit My Site
                    </Link>
                </MotionReveal>
            </section>
        </MarketingChrome>
    );
}

function BlogIndex() {
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero
                kind="blog"
                title="Blog"
                subtitle="Local SEO, performance, and how we build marketing sites."
            />
            <section className="section-shell">
                <MotionStagger
                    className="section-container blog-index-grid"
                    staggerDelay={0.08}
                >
                    {blogPosts.map((post, index) => (
                        <MotionStaggerChild
                            as="article"
                            key={post.url}
                            className="surface-card blog-index-card reveal-up"
                        >
                            <Link
                                href={post.url}
                                className={
                                    post.coverPresentation === "liftOnDark"
                                        ? "blog-index-card__media blog-cover--lift-on-dark"
                                        : "blog-index-card__media"
                                }
                                data-blog-post-link
                            >
                                <Image
                                    src={post.image}
                                    alt={post.imageAlt}
                                    width={post.imageWidth}
                                    height={post.imageHeight}
                                    className="blog-index-card__img"
                                    sizes="(max-width: 900px) 100vw, 480px"
                                    priority={index === 0}
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </Link>
                            <div className="blog-index-card__body">
                                <p className="blog-index-meta">
                                    {post.displayDate} · {post.readTime}
                                </p>
                                <h2>
                                    <Link href={post.url} data-blog-post-link>
                                        {post.title}
                                    </Link>
                                </h2>
                                <p>{post.excerpt}</p>
                                <Link
                                    href={post.url}
                                    className="inline-link"
                                    data-blog-post-link
                                >
                                    Read article →
                                </Link>
                            </div>
                        </MotionStaggerChild>
                    ))}
                </MotionStagger>
            </section>
        </MarketingChrome>
    );
}

function BlogPostPage({ slug }: { slug: string }) {
    const post = blogPosts.find((p) => p.url === `/blog/${slug}`);
    if (!post) notFound();
    const articleBlocks = getArticleBlocksForSlug(slug);
    const longform = getBlogLongformSections(post.title);
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <BlogArticleEnhancements />
            <article className="blog-article-root">
                <section
                    className="section-shell section-shell--wash marketing-page-hero"
                    data-page-kind="blog"
                >
                    <InnerPageMotionSystem kind="blog" />
                    <div className="section-container blog-article-hero">
                        <p className="blog-index-meta reveal-up">
                            {post.displayDate} · {post.readTime}
                        </p>
                        <h1 className="page-title reveal-up">{post.title}</h1>
                        <p className="page-lead reveal-up">{post.excerpt}</p>
                    </div>
                </section>
                <section className="section-shell">
                    <div className="section-container blog-article-main">
                        <div
                            className={
                                post.coverPresentation === "liftOnDark"
                                    ? "blog-article-cover blog-cover--lift-on-dark reveal-up"
                                    : "blog-article-cover reveal-up"
                            }
                        >
                            <Image
                                src={post.image}
                                alt={post.imageAlt}
                                width={post.imageWidth}
                                height={post.imageHeight}
                                priority
                                fetchPriority="high"
                                decoding="async"
                                sizes="(max-width: 1100px) 100vw, 960px"
                            />
                        </div>
                        {articleBlocks?.length ? (
                            <ArticleBody blocks={articleBlocks} />
                        ) : (
                            <div className="marketing-prose">
                                <p className="reveal-up">{post.excerpt}</p>
                                <p className="reveal-up">
                                    Full editorial for this URL is being expanded in the Next.js
                                    site. If you need the prior version on short notice, email{" "}
                                    <a
                                        className="inline-link"
                                        href="mailto:anthony@designedbyanthony.com"
                                    >
                                        anthony@designedbyanthony.com
                                    </a>{" "}
                                    and reference the headline above.
                                </p>
                            </div>
                        )}
                        
                        <div className="mt-16">
                            {longform.map((section) => (
                                <MotionReveal
                                    key={section.heading}
                                    className="reveal-up mb-10"
                                    y={16}
                                    duration={0.6}
                                >
                                    {/* Apple/Linear Sleek Card Container */}
                                    <div className="relative w-full rounded-2xl border border-white/10 bg-[rgb(10_12_18)] p-8 md:p-10">
                                        <div className="absolute left-1/2 top-0 h-[1px] w-32 -translate-x-1/2 bg-linear-to-r from-transparent via-[rgb(var(--accent-bronze-rgb)/0.8)] to-transparent" />

                                        <div className="mb-6 flex flex-col gap-2">
                                            <span className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--accent-bronze-rgb))]">
                                                Insight
                                            </span>
                                            <h3 className="font-display text-xl font-medium tracking-tight text-white md:text-2xl">
                                                {section.heading}
                                            </h3>
                                        </div>

                                        <div className="text-bubble is-bordered">
                                            {section.paragraphs.map((p, i) => (
                                                <p key={i} className={i > 0 ? "mt-4 text-[0.95rem] text-white/75" : "text-[0.95rem] text-white/75"}>
                                                    {p}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </MotionReveal>
                            ))}
                        </div>

                        <p className="reveal-up mt-8">
                            <Link href="/blog" className="inline-link" data-blog-back-button>
                                ← Back to all posts
                            </Link>
                        </p>
                    </div>
                </section>
            </article>
        </MarketingChrome>
    );
}

function PortfolioIndex() {
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero kind="portfolio" {...staticMarketingPageCopy.portfolio} />
            <section className="section-shell">
                <MotionStagger
                    className="section-container featured-work-grid"
                    staggerDelay={0.08}
                >
                    {showcaseItems.map((item) => {
                        const href = item.caseStudySlug
                            ? `/portfolio/${item.caseStudySlug}`
                            : (item.href ?? "#");
                        const isExternal = !item.caseStudySlug;
                        return (
                            <MotionStaggerChild
                                as="article"
                                key={item.name}
                                className="surface-card featured-work-card reveal-up"
                            >
                                <a
                                    href={href}
                                    target={isExternal ? "_blank" : undefined}
                                    rel={isExternal ? "noopener noreferrer" : undefined}
                                    className="featured-work-media"
                                >
                                    <div className="featured-image-wrap">
                                        <Image
                                            src={item.displayImage ?? item.image}
                                            alt={item.imageAlt ?? item.name}
                                            className="featured-image"
                                            width={640}
                                            height={480}
                                            sizes="(max-width: 900px) 100vw, 400px"
                                        />
                                    </div>
                                </a>
                                <div className="featured-copy">
                                    <span className="card-tag">{item.statusLabel}</span>
                                    <h2>{item.name}</h2>
                                    <p>{item.description}</p>
                                    <a
                                        href={href}
                                        className="featured-link"
                                        target={isExternal ? "_blank" : undefined}
                                        rel={isExternal ? "noopener noreferrer" : undefined}
                                    >
                                        {item.caseStudySlug ? "View case study" : "Open example"}
                                    </a>
                                </div>
                            </MotionStaggerChild>
                        );
                    })}
                </MotionStagger>
            </section>
        </MarketingChrome>
    );
}

function PortfolioCaseStudy({ slug }: { slug: string }) {
    const item = showcaseItems.find((i) => i.caseStudySlug === slug);
    if (!item) notFound();
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero
                kind="portfolio"
                title={item.name}
                subtitle={item.description}
            />
            <section className="section-shell">
                <MotionReveal
                    className="section-container marketing-prose reveal-up"
                    y={16}
                    duration={0.6}
                >
                    <div className="blog-article-cover">
                        <Image
                            src={item.displayImage ?? item.image}
                            alt={item.imageAlt ?? item.name}
                            width={960}
                            height={640}
                            className="featured-image"
                            sizes="(max-width: 1100px) 100vw, 960px"
                        />
                    </div>
                    <h2>Problem</h2>
                    <p>{item.problem}</p>
                    <h2>Approach</h2>
                    <p>{item.solution}</p>
                    {item.features?.length ? (
                        <>
                            <h2>Highlights</h2>
                            <ul>
                                {item.features.map((f) => (
                                    <li key={f.label}>
                                        <strong>{f.label}:</strong> {f.detail}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : null}
                    {item.href ? (
                        <p>
                            <a className={btnOutline} href={item.href}>
                                Visit live site
                            </a>
                        </p>
                    ) : null}
                    <p>
                        <Link href="/portfolio" className="inline-link">
                            ← Back to portfolio
                        </Link>
                    </p>
                </MotionReveal>
            </section>
        </MarketingChrome>
    );
}

export function StaticMarketingPage({ slug }: { slug: string }) {
    const copy = staticMarketingPageCopy[slug];
    if (!copy) notFound();
    const showContactForm = slug === "contact";
    const showFacebookCta = slug === "facebook-offer";
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero kind={slug} title={copy.title} subtitle={copy.description} />
            <ProseBlock paragraphs={copy.paragraphs} />
            {showFacebookCta ? (
                <section className="section-shell section-shell--wash">
                    <MotionReveal
                        className="section-container marketing-cta-row reveal-up"
                        y={20}
                        duration={0.6}
                    >
                        <Link href="/contact" className={btnPrimary}>
                            Let&apos;s build something great.
                        </Link>
                        <Link href="/lighthouse" className={btnOutline}>
                            Audit My Site
                        </Link>
                    </MotionReveal>
                </section>
            ) : null}
            {showContactForm ? (
                <section className="section-shell section-shell--wash contact-form-section">
                    <div className="section-container">
                        <div className="contact-form-shell surface-card reveal-up">
                            <p className="contact-form-shell__eyebrow">Contact</p>
                            <h2 className="contact-form-shell__title">Send a message</h2>
                            <p className="contact-form-shell__lede">
                                Tell us what you are trying to fix — we reply within one
                                business day.
                            </p>
                            <SalesforceContactForm />
                        </div>
                    </div>
                </section>
            ) : null}
        </MarketingChrome>
    );
}

function ThankYouPage() {
    const base = staticMarketingPageCopy["thank-you"];
    return (
        <MarketingChrome footerCta={homeFooterCta}>
            <PageHero
                kind="thank-you"
                title={base.title}
                subtitle={base.description}
            />
            <section className="section-shell">
                <MotionReveal
                    className="section-container marketing-prose"
                    y={16}
                    duration={0.6}
                >
                    {base.paragraphs.map((p) => (
                        <p key={p} className="reveal-up">
                            {p}
                        </p>
                    ))}
                    <p className="reveal-up">
                        <Link href="/" className={btnSecondaryProof}>
                            Back to home
                        </Link>
                    </p>
                </MotionReveal>
            </section>
        </MarketingChrome>
    );
}

export function MarketingSiteRouter({ path }: { path: string[] }) {
    if (path.length === 0) notFound();

    const [a, b] = path;

    if (a === "services" && path.length === 1) {
        return <ServicesIndex />;
    }
    if (a === "services" && b && path.length === 2) {
        return <ServiceDetailPage slug={b} />;
    }
    if (a === "blog" && path.length === 1) {
        return <BlogIndex />;
    }
    if (a === "blog" && b && path.length === 2) {
        return <BlogPostPage slug={b} />;
    }
    if (a === "portfolio" && path.length === 1) {
        return <PortfolioIndex />;
    }
    if (a === "portfolio" && b && path.length === 2) {
        return <PortfolioCaseStudy slug={b} />;
    }
    if (a === "thank-you" && path.length === 1) {
        return <ThankYouPage />;
    }
    /* Enriched pages — replaced sparse static copy with full sections */
    if (a === "about" && path.length === 1) return <AboutPage />;
    if (a === "pricing" && path.length === 1) return <PricingPage />;
    if (a === "ouredge" && path.length === 1) return <OurEdgePage />;
    if (a === "faq" && path.length === 1) return <FaqPage />;
    if (a === "service-areas" && path.length === 1) return <ServiceAreasPage />;
    if (a === "service-areas" && b && path.length === 2) {
        if (!isServiceAreaSlug(b)) notFound();
        return <ServiceAreaLocationPage slug={b} />;
    }
    if (path.length === 1 && staticMarketingPageCopy[a]) {
        return <StaticMarketingPage slug={a} />;
    }

    notFound();
}