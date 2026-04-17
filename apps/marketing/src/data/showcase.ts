import type { ImageMetadata } from 'astro';
import bakeryDemo from '../assets/portfolio/bakery_demo.png';
import handymanDemo from '../assets/portfolio/handyman_demo.png';
import landscapeDemo from '../assets/portfolio/landscape_demo.png';
import plumberDemo from '../assets/portfolio/plumber_demo.png';
import rooferDemo from '../assets/portfolio/roofer_demo.png';

export type ShowcaseStatus = 'example' | 'in-progress';

export interface ShowcaseFeature {
  label: string;
  detail: string;
}

export interface ShowcaseItem {
  status: ShowcaseStatus;
  statusLabel: string;
  industry: string;
  name: string;
  description: string;
  problem: string;
  solution: string;
  href?: string;
  caseStudySlug?: string;
  image?: string;
  displayImage?: ImageMetadata;
  imageAlt?: string;
  featured?: boolean;
  note?: string;
  features?: ShowcaseFeature[];
}

export const showcaseItems: ShowcaseItem[] = [
  {
    status: 'example',
    statusLabel: 'Client Build',
    industry: 'Handyman',
    name: 'The Long Beach Handyman',
    description:
      'A custom handyman website for a contractor in Long Beach, CA — built turn-key so the owner can manage content and track site performance without relying on a developer.',
    problem:
      'This Long Beach handyman needed a professional website he could run himself — update service pages, swap project photos, and change copy without hiring a developer every time. He also needed a mobile-friendly design and visibility into site traffic and search performance.',
    solution:
      'We designed and built a custom small business website on a headless CMS, giving the owner full control of every page from a visual dashboard. Contact forms route to his inbox, Google Analytics and Search Console track traffic and local search rankings, and an interactive service area map clarifies coverage in Long Beach and surrounding cities. The result is a fast-loading, mobile-responsive contractor website the owner runs day to day without ongoing developer dependency.',
    href: 'https://thelongbeachhandyman.com/',
    caseStudySlug: 'the-long-beach-handyman',
    image: '/images/handyman_demo.png',
    displayImage: handymanDemo,
    imageAlt: 'Custom handyman website design for The Long Beach Handyman — a client build by Designed by Anthony featuring local SEO, lead capture, and mobile-friendly responsive design',
    featured: true,
    features: [
      {
        label: 'Owner-managed CMS',
        detail:
          'Built on Storyblok, a headless content management system that lets the owner update service pages, project photos, and website copy from a visual dashboard — no code and no ongoing developer dependency.',
      },
      {
        label: 'Built-in lead capture',
        detail:
          'Every contact form runs through Web3Forms so lead inquiries go straight to the owner\'s inbox in real time. No missed phone calls or quote requests, and no third-party CRM required to start generating leads from the website.',
      },
      {
        label: 'Analytics and Search Console',
        detail:
          'Google Analytics and Google Search Console are connected from day one, giving the owner clear visibility into website traffic, page performance, local search rankings, and which service pages drive the most phone calls and conversions.',
      },
      {
        label: 'Near-perfect Lighthouse performance',
        detail:
          'Custom-coded in Astro — a modern web framework that ships almost zero JavaScript to the browser. The result is a fast-loading, mobile-friendly website with near-flawless Google Lighthouse scores across performance, accessibility, best practices, and SEO.',
      },
      {
        label: 'Interactive service area map',
        detail:
          'An embedded Google Maps integration highlights every neighborhood and city the handyman serves across Long Beach, CA, making it immediately clear to local homeowners whether they are in the service coverage zone.',
      },
    ],
  },

  {
    status: 'example',
    statusLabel: 'Example Build',
    industry: 'Roofing',
    name: 'Summit Roofing',
    description:
      'A roofing example build focused on credibility, clearer service framing, and a more confident estimate path.',
    problem:
      'Roofing is a high-trust, high-dollar decision. Homeowners need to believe you are established and reliable before they will hand over a deposit.',
    solution:
      'Professional presentation that communicates experience, clear positioning on services and coverage area, and a simple path for homeowners to request an estimate.',
    href: 'https://roofing-demo.web.app/',
    image: '/images/roofer_demo.png',
    displayImage: rooferDemo,
    imageAlt: 'Summit Roofing example website by Designed by Anthony',
    featured: true,
  },
  {
    status: 'example',
    statusLabel: 'Example Build',
    industry: 'Landscaping',
    name: 'Apex Landscaping & Snow Removal',
    description:
      'A landscaping example build with clearer service breakdowns and a stronger quote-request path for homeowners.',
    problem:
      'Landscaping companies often cram every service onto one page and hope someone calls. This build separates services clearly so homeowners can find exactly what they need.',
    solution:
      'Clear service breakdowns, a professional feel that matches the quality of the outdoor work, and a layout that moves visitors toward a quote request.',
    href: 'https://designed-by-anthony-c18bd.web.app/',
    image: '/images/landscape_demo.png',
    displayImage: landscapeDemo,
    imageAlt: 'Apex Landscaping and Snow Removal example website by Designed by Anthony',
  },
  {
    status: 'example',
    statusLabel: 'Example Build',
    industry: 'Food and Beverage',
    name: 'Marble & Bloom Bakery',
    description:
      'A premium launch-page example showing how atmosphere, copy, and conversion flow can be tailored to a specific audience.',
    problem:
      'Most bakery and food service websites use the same template as every other business in town. This build shows what happens when the design and copy are shaped for a specific audience.',
    solution:
      'A premium launch page with strong atmosphere, focused messaging, and a clear path for first-time visitors to become repeat customers.',
    href: 'https://food-service-demo-c7ecd.web.app/',
    image: '/images/bakery_demo.png',
    displayImage: bakeryDemo,
    imageAlt: 'Marble & Bloom Bakery example website by Designed by Anthony',
  },
  {
    status: 'example',
    statusLabel: 'Example Build',
    industry: 'Plumbing',
    name: 'Copperline Plumbing',
    description:
      'A plumbing example build designed for fast first impressions, stronger trust, and an easier path to the phone on mobile.',
    problem:
      'Homeowners searching for a plumber are usually in a hurry and comparing options fast. A slow or generic site loses the call before the page finishes loading.',
    solution:
      'Clear emergency messaging, strong local positioning, and a mobile experience designed so calling is the easiest action on the page.',
    href: 'https://plumber-demo-404e2.web.app/',
    image: '/images/plumber_demo.png',
    displayImage: plumberDemo,
    imageAlt: 'Copperline Plumbing example website by Designed by Anthony',
    featured: true,
  },
  {
    status: 'in-progress',
    statusLabel: 'Design Concept',
    industry: 'Medspa & Wellness',
    name: 'Serenity Medspa — Concept Build',
    description:
      'A concept build for a modern medspa brand — the kind of editorial, premium-feeling website we would ship for a clinic offering injectables, IV therapy, and skincare in the Mohawk Valley.',
    problem:
      'Most medspa and wellness sites in the region are Squarespace templates that feel interchangeable. A brand charging premium prices for a premium treatment experience deserves a website that reads as calm, confident, and brand-driven — not a generic service list with a booking button.',
    solution:
      'Editorial layouts with generous whitespace, serif display typography for a quieter luxury feel, a service menu that frames treatments as experiences, a booking flow tuned to the provider stack, and imagery direction that matches the in-treatment aesthetic. Built to feel like an extension of the reception experience, not a template.',
    note: 'This is a concept direction published to show visual range beyond trades. The first medspa / wellness client engagement turns this into a live case study — reach out if that would be yours.',
  },
  {
    status: 'in-progress',
    statusLabel: 'Design Concept',
    industry: 'Multi-Location & Franchise',
    name: 'Empire Home Services — 3-Location Concept',
    description:
      'A concept build for a multi-location home-service operator — the structure, local SEO, and booking integration we would ship for an HVAC, plumbing, or electrical business running two to four locations across Central New York.',
    problem:
      'Multi-location home-service sites often end up as one generic homepage plus a list of locations nobody clicks. The result: every market competes for the same search visibility, leads route to the wrong office, and the CRM is a mess.',
    solution:
      'Distinct location pages scoped to each market (with their own reviews, service areas, and local search signals), a shared lead capture flow that routes to the right dispatcher, CRM integration (ServiceTitan, Jobber, Housecall Pro, or similar), and a technician or team directory that builds trust per city. Priced in the $8,000–$15,000 range for 2–4 locations depending on integration depth.',
    note: 'Concept build published to show the scope we can handle on the multi-location side. First franchise / multi-location engagement becomes the live case study.',
  },
];

export const showcaseExampleItems = showcaseItems.filter(
  (item): item is ShowcaseItem & {
    status: 'example';
    href: string;
    image: string;
    displayImage: ImageMetadata;
    imageAlt: string;
  } => item.status === 'example',
);

export const showcaseFeaturedItems = showcaseExampleItems.filter((item) => item.featured);

export const showcaseInProgressItems = showcaseItems.filter(
  (item): item is ShowcaseItem & {
    status: 'in-progress';
    note: string;
  } => item.status === 'in-progress',
);
