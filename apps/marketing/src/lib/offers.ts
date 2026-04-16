export const STANDARD_WEBSITE_STARTING_PRICE = '$999';
export const FACEBOOK_PRIVATE_WEBSITE_PRICE = '$500';

export const PUBLIC_SITE_SOCIAL_IMAGE = '/images/og-site-premium.png';
export const FACEBOOK_OFFER_SOCIAL_IMAGE = '/images/og-facebook-offer-premium.png';

export const PRIVATE_FACEBOOK_LABEL = 'Private Facebook Offer';

export const PUBLIC_PAYMENT_STRUCTURE_COPY = '50% down to start, 50% at launch.';

/** Launch program: first N local partners — complimentary build with Growth Plan enrollment. */
export const FOUNDING_PARTNER_BUILD_SLOTS = 10;
export const FOUNDING_PARTNER_SEO_MONTHLY = '$100';
/** Public name for the founding-partner monthly stack (hosting, security, SEO). */
export const FOUNDING_PARTNER_SEO_LABEL = 'Growth Plan';

/** Ongoing local SEO + hosting (lighter scope than the full GBP program). Same value as founding partner monthly. */
export const MONTHLY_LOCAL_SEO_PRICE = FOUNDING_PARTNER_SEO_MONTHLY;

/**
 * Full Google Business Profile & local marketing program (Merchynt-style stack), per location / month.
 * Published on /services/google-business-profile — change here to keep pricing consistent sitewide.
 */
export const GBP_FULL_PROGRAM_MONTHLY_PRICE = '$299';

/** Opening line: dev studio launch, $0 upfront vs standard pricing (matches cold email “The offer”). */
export const FOUNDING_PARTNER_OFFER_SENTENCE = `Designed by Anthony is launching as a dev studio: the first ${FOUNDING_PARTNER_BUILD_SLOTS} approved partners get a professional custom website at $0 upfront (standard builds typically start at ${STANDARD_WEBSITE_STARTING_PRICE}+).`;

/** Case studies, review ask, Growth Plan scope (matches cold email “The why”). */
export const FOUNDING_PARTNER_WHY_SENTENCE = `We are publishing Founding Case Studies on the site—how a real website grows a local brand—and we ask for a Google review plus the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL}, which covers your Google Cloud hosting, security, and SEO.`;

export const FOUNDING_PARTNER_SHORT_COPY = `${FOUNDING_PARTNER_OFFER_SENTENCE} ${FOUNDING_PARTNER_WHY_SENTENCE}`;

/** Compact blurb for path cards / secondary CTAs — not a repeat of the full offer+why paragraphs. */
export const FOUNDING_PARTNER_PATH_CARD_SUMMARY = `Limited to ${FOUNDING_PARTNER_BUILD_SLOTS} founding partners: if you qualify, you get the build at $0 upfront and enroll in the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL}. Book a short call to confirm fit.`;

export const PUBLIC_PRICING_NOTE = `Standard custom website builds start at ${STANDARD_WEBSITE_STARTING_PRICE}. The founding partner program includes ${FOUNDING_PARTNER_BUILD_SLOTS} complimentary builds for qualified local businesses alongside the ${FOUNDING_PARTNER_SEO_MONTHLY}/month ${FOUNDING_PARTNER_SEO_LABEL}.`;

export const PUBLIC_PRICING_PILL = `${FOUNDING_PARTNER_BUILD_SLOTS} launch pilot spots · ${STANDARD_WEBSITE_STARTING_PRICE} standard`;

export const PUBLIC_PROJECT_DECISION_COPY = `whether the next step is a smaller cleanup, SEO work, a full rebuild, or claiming one of the remaining founding partner spots.`;

export const FACEBOOK_PRIVATE_OFFER_COPY =
  `${PRIVATE_FACEBOOK_LABEL}. Invite-only rate reserved for direct outreach.`;

/**
 * Facebook Ads destination URL (paste in Ads Manager; not used by app code):
 * https://designedbyanthony.com/facebook-offer?utm_source=facebook&utm_medium=paid_social&utm_campaign=founding_partner_facebook&utm_content=private_offer
 */

/** Calendly with matching UTMs for strategy calls from this landing page. */
export const FACEBOOK_OFFER_CALENDLY_WITH_UTM =
  'https://calendly.com/anthony-designedbyanthony/web-design-consult?utm_source=facebook&utm_medium=paid_social&utm_campaign=founding_partner_facebook&utm_content=strategy_call';
