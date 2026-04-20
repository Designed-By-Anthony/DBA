export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
};

export const blogPosts: BlogPostMeta[] = [
  {
    slug: "why-we-built-a-crm-that-changes-shape",
    title: "Why we built a CRM that changes shape",
    description:
      "A deep dive into VertaFlow's vertical-aware UX and why industry vocabulary should be first-class, not an afterthought.",
    publishedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    category: "Product",
  },
  {
    slug: "pos-crm-one-system-for-operators",
    title: "POS + CRM: why they should be the same tool",
    description:
      "How combining POS, CRM, and loyalty in one tenant-scoped system reduces operational drag for restaurants and retailers.",
    publishedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    category: "Operations",
  },
  {
    slug: "zero-trust-multi-tenancy-for-small-business-crm",
    title: "Zero-trust multi-tenancy: what it means for your data",
    description:
      "A practical explanation of row-level tenant isolation and how VertaFlow protects cross-vertical business data in production.",
    publishedAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    category: "Security",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "What do you mean by chameleon CRM?",
    answer:
      "VertaFlow adapts labels, pipeline stages, and workflows per vertical while keeping one secure data model underneath.",
  },
  {
    question: "Can I switch verticals after signing up?",
    answer:
      "Yes. Vertical mode can change without losing records; tenant data stays intact while interface semantics update.",
  },
  {
    question: "Is my data isolated from other businesses?",
    answer:
      "Yes. Every data path is tenant scoped with row-level isolation to prevent cross-account leakage.",
  },
  {
    question: "Do I need to install an app?",
    answer:
      "No. VertaFlow is a PWA and runs in-browser, with optional install plus offline queueing and sync recovery.",
  },
  {
    question: "What payment processor do you use?",
    answer:
      "Stripe powers invoices, subscriptions, POS terminal payments, and payout workflows.",
  },
  {
    question: "Can my clients see their own portal?",
    answer:
      "Yes. Clients can access a branded portal through secure magic-link entry without managing passwords.",
  },
];

function buildFaqPageObject() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBlogPostingLdJson(origin: string, post: BlogPostMeta): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: `${origin}/blog/${post.slug}`,
      publisher: {
        "@type": "Organization",
        name: "VertaFlow",
        url: origin,
        logo: `${origin}/icons/icon-512.png`,
      },
      author: {
        "@type": "Organization",
        name: "VertaFlow",
      },
      articleSection: post.category,
    },
    null,
    2,
  );
}

export function buildFaqLdJson(): string {
  return JSON.stringify(buildFaqPageObject(), null, 2);
}

export function buildFaqStructuredData() {
  return buildFaqPageObject();
}

export function buildBlogCollectionStructuredData(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "VertaFlow Blog",
    url: `${origin}/blog/`,
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      url: `${origin}/blog/${post.slug}`,
      articleSection: post.category,
      publisher: {
        "@type": "Organization",
        name: "VertaFlow",
        url: origin,
      },
      author: {
        "@type": "Organization",
        name: "VertaFlow",
      },
    })),
  };
}
