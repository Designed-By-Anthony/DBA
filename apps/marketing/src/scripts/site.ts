import { initDeferredThirdPartyLoader } from "./analytics";
import { initAuditForms, initFacebookOfferTracking } from "./audit-forms";
import { initBlogScrollState, initReadingProgress } from "./reading-progress";
import {
	initCookieSettingsLinks,
	initCursorGlow,
	initFaqAccordion,
	initGbpRoiCalculator,
	initLayoutCalendlyEmbed,
	initMagneticLinks,
	initMobileNav,
	initReachOutModal,
	initRevealAnimations,
	initTabbedProof,
} from "./ui";

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

document.addEventListener("astro:page-load", runPageScripts);
runPageScripts();
