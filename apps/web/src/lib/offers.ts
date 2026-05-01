/** Line item shown on all pricing tiers: custom brand-config window before launch. */
export const BESPOKE_CONFIG_LABEL = "Bespoke Brand Integration (24-48h config)";

/** Stripe session / onboarding copy — describes the provisioning delay. */
export const BESPOKE_CONFIG_DESCRIPTION =
	"Access is granted 24-48 hours after our design sync to ensure brand mapping meets the ANTHONY. standard.";

/** Spanish translation of the provisioning message — used on /es and in the checkout success page. */
export const BESPOKE_CONFIG_DESCRIPTION_ES =
	"El acceso se concede entre 24 y 48 horas después de nuestra sincronización de diseño para garantizar que el mapeo de marca cumpla el estándar ANTHONY.";

export const STANDARD_WEBSITE_STARTING_PRICE = "$999";
/**
 * Typical total project band for a standard custom rebuild (5–10 pages, custom
 * design, technical + local SEO setup). Dialed for CNY / Mohawk Valley buying
 * expectations while staying above template work — pair with the public
 * installment headline instead of leading with a single large sticker number.
 */
export const STANDARD_WEBSITE_TYPICAL_RANGE = "$1,900–$3,000";
/** One-third of a ~$2,499 typical anchor — shown as “3 easy payments” at launch. */
export const STANDARD_WEBSITE_INSTALLMENT_EACH = "$833";
/**
 * Starting price for enterprise / multi-location / integration-heavy scope.
 * Benchmarked against the national growing-business / enterprise bracket
 * ($8,000–$25,000) — anchored low so prospects see a concrete floor instead of
 * an opaque "Custom" quote.
 */
export const ENTERPRISE_WEBSITE_STARTING_PRICE = "$6,000";
export const FACEBOOK_PRIVATE_WEBSITE_PRICE = "$500";

export const PUBLIC_SITE_SOCIAL_IMAGE = "/images/og-site-premium.png";
export const FACEBOOK_OFFER_SOCIAL_IMAGE =
	"/images/og-facebook-offer-premium.png";

export const PRIVATE_FACEBOOK_LABEL = "Private Facebook Offer";

/** Months of included hosting + SEO care bundled with a standard rebuild before the monthly retainer. */
export const PUBLIC_LAUNCH_BUNDLE_MONTHS = 3;

/** Launch program: first N local partners — complimentary build with Growth Plan enrollment. */
export const FOUNDING_PARTNER_BUILD_SLOTS = 10;
/**
 * Founding Growth Plan — hosting, security, SEO, and client workspace (portal + roadmap automations).
 * Set at $149/mo: below typical SMB CRM seat bundles ($15–75+/user/mo × tools) while reflecting bundled
 * web + local SEO + product value vs. standalone $100–300/mo hosting retainers.
 */
export const FOUNDING_PARTNER_SEO_MONTHLY = "$149";
/** Public name for the founding-partner monthly stack (hosting, security, SEO). */
export const FOUNDING_PARTNER_SEO_LABEL = "Growth Plan";

/** Shown on pricing, hero, and FAQs — installment frame + what happens after month three. */
export const PUBLIC_STANDARD_PAYMENT_PLAN = `3 easy payments of ${STANDARD_WEBSITE_INSTALLMENT_EACH} at launch for most standard rebuilds (typical all-in scope lands in the ${STANDARD_WEBSITE_TYPICAL_RANGE} band).`;

export const PUBLIC_LAUNCH_BUNDLE_COPY = `For the first ${PUBLIC_LAUNCH_BUNDLE_MONTHS} months we host, secure, and actively tune the site with core local SEO — then, if you want to keep momentum, you roll into the ${FOUNDING_PARTNER_SEO_MONTHLY}/mo ${FOUNDING_PARTNER_SEO_LABEL}.`;

/** Legacy single-line copy for anywhere that still expects one sentence (FAQ, process). */
export const PUBLIC_PAYMENT_STRUCTURE_COPY = `${PUBLIC_STANDARD_PAYMENT_PLAN} ${PUBLIC_LAUNCH_BUNDLE_COPY}`;

/** Admin CRM console origin (lead ingest, pipeline). */
export const CRM_ADMIN_APP_URL = "https://admin.designedbyanthony.com";
/** Client portal (magic-link access); Growth Plan positioning. */
export const ACCOUNTS_PORTAL_URL = "https://accounts.designedbyanthony.com";

/**
 * CRM tier list prices (per organization / month).
 * Capture: leads + scheduling + light pipeline. Suite: full product (portal, automations roadmap, deeper CRM).
 * Growth Plan ($149) bundles Suite-level access with hosting + local SEO — better value than Suite alone for site clients.
 */
export const CRM_CAPTURE_TIER_LABEL = "Capture";
export const CRM_SUITE_TIER_LABEL = "Suite";
export const CRM_CAPTURE_MONTHLY = "$69";
export const CRM_SUITE_MONTHLY = "$179";

/** Ongoing local SEO + hosting (lighter scope than the full GBP program). Same value as founding partner monthly. */
export const MONTHLY_LOCAL_SEO_PRICE = FOUNDING_PARTNER_SEO_MONTHLY;

/**
 * Full Google Business Profile & local marketing program (Merchynt-style stack), per location / month.
 * Published on /services/google-business-profile — change here to keep pricing consistent sitewide.
 */
export const GBP_FULL_PROGRAM_MONTHLY_PRICE = "$299";

/** Opening line: dev studio launch, $0 upfront vs standard pricing (matches cold email “The offer”). */
export const FOUNDING_PARTNER_OFFER_SENTENCE = `ANTHONY. is launching as a dev studio: the first ${FOUNDING_PARTNER_BUILD_SLOTS} approved partners get a professional custom website at $0 upfront (standard builds typically start at ${STANDARD_WEBSITE_STARTING_PRICE}+).`;

/** Case studies, review ask, Growth Plan scope (matches cold email “The why”). */
export const FOUNDING_PARTNER_WHY_SENTENCE = `We are publishing Founding Case Studies on the site—how a real website grows a local brand—and we ask for a Google review plus the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL}, which covers your Google Cloud hosting, security, and SEO.`;

export const FOUNDING_PARTNER_SHORT_COPY = `${FOUNDING_PARTNER_OFFER_SENTENCE} ${FOUNDING_PARTNER_WHY_SENTENCE}`;

/** Compact blurb for path cards / secondary CTAs — not a repeat of the full offer+why paragraphs. */
export const FOUNDING_PARTNER_PATH_CARD_SUMMARY = `Limited to ${FOUNDING_PARTNER_BUILD_SLOTS} founding partners: if you qualify, you get the build at $0 upfront and enroll in the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL}. Book a short call to confirm fit.`;

export const PUBLIC_PRICING_NOTE = `Standard custom website builds start at ${STANDARD_WEBSITE_STARTING_PRICE}. The founding partner program includes ${FOUNDING_PARTNER_BUILD_SLOTS} complimentary builds for qualified local businesses alongside the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL}.`;

export const PUBLIC_PRICING_PILL = `${FOUNDING_PARTNER_BUILD_SLOTS} launch pilot spots · ${STANDARD_WEBSITE_STARTING_PRICE} standard`;

export const PUBLIC_PROJECT_DECISION_COPY = `whether the next step is a smaller cleanup, SEO work, a full rebuild, or claiming one of the remaining founding partner spots.`;

export const FACEBOOK_PRIVATE_OFFER_COPY = `${PRIVATE_FACEBOOK_LABEL}. Invite-only rate reserved for direct outreach.`;

/**
 * Facebook Ads destination URL (paste in Ads Manager; not used by app code):
 * https://designedbyanthony.com/facebook-offer?utm_source=facebook&utm_medium=paid_social&utm_campaign=founding_partner_facebook&utm_content=private_offer
 */
