import { initDeferredThirdPartyLoader } from "./analytics";
import { initAuditForms, initFacebookOfferTracking } from "./audit-forms";
import { initBlogScrollState, initReadingProgress } from "./reading-progress";
import {
	initCookieSettingsLinks,
	initCursorGlow,
	initExclusiveDetails,
	initFaqAccordion,
	initGbpRoiCalculator,
	initLayoutCalendlyEmbed,
	initMagneticLinks,
	initMobileNav,
	initReachOutModal,
	initRevealAnimations,
	initTabbedProof,
} from "./ui";
import { initWebMCP } from "./webmcp";

/** Abort previous window-level listeners when re-running after page transitions. */
let pageLifecycleAbort: AbortController | undefined;
let pageScriptsScheduled = false;

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
	initExclusiveDetails();
	initBlogScrollState(signal);
	initReadingProgress(signal);
	initAuditForms();
	initTabbedProof();
	initCursorGlow();
	initFacebookOfferTracking();
	initGbpRoiCalculator();
	initCookieSettingsLinks();
	initMagneticLinks();
	initWebMCP();
}

function scheduleRunPageScripts(): void {
	if (pageScriptsScheduled) return;
	pageScriptsScheduled = true;
	window.requestAnimationFrame(() => {
		window.setTimeout(() => {
			pageScriptsScheduled = false;
			runPageScripts();
		}, 0);
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", scheduleRunPageScripts, {
		once: true,
	});
} else {
	window.addEventListener("load", scheduleRunPageScripts, { once: true });
	if (document.readyState === "complete") {
		scheduleRunPageScripts();
	}
}

window.addEventListener("dba:page-ready", scheduleRunPageScripts);
