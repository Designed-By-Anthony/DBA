import { initDeferredThirdPartyLoader } from './analytics';
import {
  initMobileNav,
  initLayoutCalendlyEmbed,
  initReachOutModal,
  initRevealAnimations,
  initTabbedProof,
  initFaqAccordion,
  initCursorGlow,
  initMagneticLinks,
  initGbpRoiCalculator,
  initCookieSettingsLinks,
} from './ui';
import { initBlogScrollState, initReadingProgress } from './reading-progress';
import { initAuditForms, initFacebookOfferTracking } from './audit-forms';

/** Abort previous window-level listeners when re-running after Astro view transitions. */
let pageLifecycleAbort: AbortController | undefined;

function runPageScripts(): void {
  pageLifecycleAbort?.abort();
  pageLifecycleAbort = new AbortController();
  const { signal } = pageLifecycleAbort;

  initDeferredThirdPartyLoader();
  initRevealAnimations();
  initMobileNav();
  initReachOutModal();
  initLayoutCalendlyEmbed();
  initFaqAccordion();
  initBlogScrollState(signal);
  initReadingProgress(signal);
  initAuditForms();
  initTabbedProof();
  initCursorGlow();
  initFacebookOfferTracking();
  initGbpRoiCalculator();
  initCookieSettingsLinks();
  initMagneticLinks();
}

document.addEventListener('astro:page-load', runPageScripts);
runPageScripts();
