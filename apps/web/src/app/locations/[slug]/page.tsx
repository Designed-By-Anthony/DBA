import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { homeFooterCta } from "@/data/home";
import { btnOutline, btnPrimary } from "@/design-system/buttons";

export const revalidate = 86400;

interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string;
}

async function fetchLocationMetadata(slug: string): Promise<SeoMetadata | null> {
  try {
    const response = await fetch(
      `https://api.designedbyanthony.com/api/seo/metadata?page_url=/locations/${encodeURIComponent(slug)}`,
      { next: { revalidate: 86400 } },
    );
    if (!response.ok) return null;
    const data = await response.json() as Record<string, unknown>;
    if (typeof data.title !== "string" || !data.title) return null;
    return {
      title: data.title,
      description: typeof data.description === "string" ? data.description : "",
      keywords: typeof data.keywords === "string" ? data.keywords : undefined,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const metadata = await fetchLocationMetadata(slug);

  if (!metadata) {
    return { title: "Not found" };
  }

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: { canonical: `/locations/${slug}` },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `https://designedbyanthony.com/locations/${slug}`,
      type: "website",
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const metadata = await fetchLocationMetadata(slug);

  if (!metadata) {
    notFound();
  }

  return (
    <MarketingChrome footerCta={homeFooterCta}>
      <section className="section-shell section-shell--wash marketing-page-hero">
        <div className="section-container">
          <p className="text-[0.72rem] font-[family-name:var(--font-inter)] uppercase tracking-[0.22em] text-[rgb(var(--accent-bronze-rgb))] mb-3">
            {metadata.title}
          </p>
          <h1 className="page-title max-w-[44rem]">{metadata.title}</h1>
          <p className="page-lead max-w-[42rem] mt-4">{metadata.description}</p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link href="/contact" className={btnPrimary}>
              Let&apos;s build something great.
            </Link>
            <Link href="/lighthouse" className={btnOutline}>
              Audit My Site
            </Link>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}