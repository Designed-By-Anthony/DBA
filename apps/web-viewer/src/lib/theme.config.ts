// ============================================
// Agency OS — White-Label Configuration
// ============================================

import type { PipelineColumn } from './types';

export const brandConfig = {
  name: 'Designed by Anthony',
  shortName: 'DBA',
  primaryHue: 221,
  logo: '/dba-mark.webp',
  domain: 'designedbyanthony.com',
  /** Public contact + mailto links in the app */
  supportEmail: 'anthony@designedbyanthony.com',
} as const;

export const pipelineStages: PipelineColumn[] = [
  { id: 'lead', label: 'New Lead', color: '#3b82f6', probability: 0.1 },
  { id: 'contacted', label: 'Contacted', color: '#3b82f6', probability: 0.25 },
  { id: 'proposal', label: 'Proposal Sent', color: '#f59e0b', probability: 0.5 },
  { id: 'dev', label: 'In Development', color: '#10b981', probability: 0.8 },
  { id: 'launched', label: 'Launched', color: '#06d6a0', probability: 1.0 },
];

export const dealSources = [
  'Lighthouse Audit',
  'Referral',
  'Cold Outbound',
  'Inbound',
  'Organic',
  'Social Media',
  'Networking',
] as const;

export const complianceConfig = {
  fromName: 'Anthony | Designed by Anthony',
  /** Resend “from” address — must be from a domain verified in Resend */
  fromEmail: 'anthony@designedbyanthony.com',
  replyTo: 'anthony@designedbyanthony.com',
  /** Inbound notifications (new lead, ticket, payment, Calendly) */
  adminNotificationEmail: 'anthony@designedbyanthony.com',
  // CAN-SPAM requires a physical address that can receive mail — using virtual mailbox
  physicalAddress: 'Designed by Anthony\\n2709 N Hayden Island Dr, STE 480114\\nPortland, OR 97217',
  companyName: 'Designed by Anthony',
} as const;

export const emailTemplates = [
  {
    id: 'intro',
    name: 'Introduction',
    subject: 'Transform Your Digital Presence — Free Audit Inside',
    body: `<p>Hi {{name}},</p>
<p>I came across <strong>{{company}}</strong> and noticed some opportunities to strengthen your online presence.</p>
<p>I specialize in building high-performance websites and digital strategies for businesses like yours. I'd love to offer you a <strong>complimentary digital presence audit</strong> — a detailed report showing exactly where your website stands and what improvements could drive more leads.</p>
<p>Would you be open to a quick 15-minute call this week?</p>
<p>Best,<br/>Anthony<br/>Designed by Anthony</p>`,
  },
  {
    id: 'audit-followup',
    name: 'Audit Follow-Up',
    subject: 'Your Digital Audit Results — {{company}}',
    body: `<p>Hi {{name}},</p>
<p>I just finished running a full digital presence audit for <strong>{{company}}</strong>, and I found some interesting insights I'd like to share with you.</p>
<p>Here's a quick summary:</p>
<ul>
<li>Your site performance score and what it means for SEO</li>
<li>Key technical issues that could be hurting conversions</li>
<li>Quick wins that could boost your online visibility</li>
</ul>
<p>I'd love to walk you through the full report. Do you have 15 minutes this week?</p>
<p>Best,<br/>Anthony<br/>Designed by Anthony</p>`,
  },
  {
    id: 'proposal-followup',
    name: 'Proposal Follow-Up',
    subject: 'Following Up — {{company}} Website Proposal',
    body: `<p>Hi {{name}},</p>
<p>I wanted to follow up on the proposal I sent over for <strong>{{company}}</strong>. I'm excited about the opportunity to work together and wanted to see if you had any questions.</p>
<p>I'm happy to jump on a quick call to walk through the details and discuss next steps.</p>
<p>Looking forward to hearing from you!</p>
<p>Best,<br/>Anthony<br/>Designed by Anthony</p>`,
  },
  {
    id: 'checkin',
    name: 'Monthly Check-In',
    subject: 'Quick Check-In — How\'s Everything Going?',
    body: `<p>Hi {{name}},</p>
<p>Just wanted to check in and see how things are going with <strong>{{company}}</strong>. It's been a while since we last connected.</p>
<p>If there's anything I can help with — whether it's a website refresh, SEO improvements, or anything else — I'm just a reply away.</p>
<p>Hope you're doing well!</p>
<p>Best,<br/>Anthony<br/>Designed by Anthony</p>`,
  },
] as const;

// ============================================
// Pricing Tiers
// ============================================

import type { PricingTierConfig } from './types';

export const pricingTiers: PricingTierConfig[] = [
  {
    id: 'hosting',
    name: 'Hosting & Maintenance',
    price: 40,
    interval: 'year',
    description: 'Premium hosting and continuous technical maintenance',
    features: [
      'High-performance hosting',
      'SSL certificate',
      'Daily backups',
      'Security monitoring',
      'Technical maintenance',
    ],
  },
  {
    id: 'seo_basic',
    name: 'Basic SEO',
    price: 100,
    interval: 'month',
    description: 'Essential SEO to build your online visibility',
    features: [
      'Google Business Profile management',
      'Review requesting & responses',
      'Directory citations',
      'Monthly visibility reports',
      'Website optimization recommendations',
    ],
  },
  {
    id: 'seo_local',
    name: 'Local SEO Pro',
    price: 299,
    interval: 'month',
    description: 'Full-service local SEO — $299/mo per location',
    features: [
      'Full Google Business Profile management',
      'Review requesting and responses',
      'Social posting (where applicable)',
      'Video support & YouTube optimization',
      'AI discovery guidance',
      'Website optimization recommendations',
      '50+ directory citations & sync',
      'Heatmap-style tracking & visibility reports',
    ],
  },
];

// ============================================
// Webhook Config
// ============================================

export const webhookConfig = {
  // Shared secret for verifying inbound webhooks from designedbyanthony.com
  leadWebhookSecret: process.env.LEAD_WEBHOOK_SECRET || 'dba-lead-hook-2026',
} as const;

// ============================================
// MSA Contract Template
// ============================================

export const msaTemplate = {
  title: 'Master Service Agreement: Web Development & Local SEO',
  provider: 'Designed by Anthony',
  physicalAddress: 'Rome, NY 13440',
  sections: {
    scopeOfWork: [
      'A custom-coded, high-performance website engineered for maximum speed and lead conversion.',
      'Mobile-responsive design and integrated lead-capture architecture.',
      'Ongoing Local SEO management to increase visibility in local search results.',
      'Premium hosting and continuous technical maintenance.',
    ],
    clientResponsibilities:
      'The Client agrees to provide all necessary assets (logos, images, service descriptions) via the Designed by Anthony Onboarding Portal within 5 business days of signing this agreement to ensure project timelines are met.',
    ownershipClause:
      'Upon final launch and provided the Client\'s account is in good standing, the Client retains ownership of their domain name and any original content provided. Designed by Anthony retains ownership of the underlying proprietary code, custom scripts, and architectural frameworks used to deploy the website. If the Client terminates the monthly retainer, the custom-coded website will be taken offline, but the Client retains all original text, logos, and their domain.',
    termination:
      'This agreement is month-to-month after the initial build. Either party may terminate this agreement with a 30-day written notice.',
  },
} as const;
