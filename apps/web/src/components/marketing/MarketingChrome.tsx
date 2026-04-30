import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { BrandHeader } from "@/components/brand/BrandHeader";
import {
	SITE_AUDIT_CTA,
	SITE_CONTACT_LINK,
	SITE_HEADER_NAV_LINKS,
} from "@/design-system/site-config";
import { businessProfile } from "@/lib/seo";
import { FooterCta, type FooterCtaProps } from "./FooterCta";
import { PageLifecycle } from "./PageLifecycle";
import { SiteContactDrawer } from "./SiteContactDrawer";

const mailtoContactHref = `mailto:${businessProfile.email}?subject=${encodeURIComponent("Website inquiry — Designed by Anthony")}`;

const siteScriptVersion =
	process.env.NEXT_PUBLIC_SITE_SCRIPT_BUILD_ID ?? "local";

export function MarketingChrome({
	children,
	footerCta,
	hidePreFooterCta,
	minimalChrome,
}: {
	children: ReactNode;
	footerCta?: FooterCtaProps;
	hidePreFooterCta?: boolean;
	minimalChrome?: boolean;
}) {
	if (minimalChrome) {
		return <>{children}</>;
	}

	return (
		<>
			<PageLifecycle />
			<Script id="trusted-types-inline" strategy="beforeInteractive">
				{`
(function () {
  if (!window.trustedTypes || !window.trustedTypes.createPolicy) return;
  try {
    window.trustedTypes.createPolicy('default', {
      createHTML: function (s) { return s; },
      createScript: function (s) { return s; },
      createScriptURL: function (s) { return s; },
    });
  } catch (_) {}
})();`}
			</Script>
			<Script id="dba-ga-consent" strategy="beforeInteractive">
				{`
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
window.__dbaAnalyticsEnabled = false;
window.gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});
var gtmLoaded = false;
var gtmConfigured = false;
window.__dbaCookieConsentKey = 'dba_cookie_consent';
function configureGtm() {
  if (gtmConfigured) return;
  gtmConfigured = true;
}
window.__dbaLoadAnalytics = function () {
  if (gtmLoaded) return;
  gtmLoaded = true;
  if (document.getElementById('dba-gtm-loader')) return;
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.id='dba-gtm-loader';j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-W2JBTH5L');
};
window.__dbaGrantAnalyticsConsent = function () {
  window.__dbaAnalyticsEnabled = true;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
  window.dataLayer.push({ event: 'consent_granted' });
};
window.__dbaRevokeAnalyticsConsent = function () {
  window.__dbaAnalyticsEnabled = false;
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
};`}
			</Script>

			<div
				id="reading-progress-bar"
				aria-hidden="true"
				className="fixed left-0 top-0 z-[110] h-1 w-0 rounded-r bg-gradient-to-r from-sky-500 via-sky-400 to-sky-200 transition-[width] duration-100"
			/>

			<div className="relative min-h-screen">
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-md focus:bg-sky-500 focus:px-4 focus:py-3 focus:text-white"
				>
					Skip to content
				</a>
				<BrandHeader />

				<div
					id="mobile-nav"
					className="fixed inset-0 z-[100] hidden bg-black/95 text-white md:hidden"
					role="dialog"
					aria-modal="true"
					aria-labelledby="mobile-nav-title"
					aria-hidden="true"
				>
					<div className="flex min-h-full flex-col overflow-y-auto">
						<div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
							<h2
								id="mobile-nav-title"
								className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55"
							>
								Navigation
							</h2>
							<button
								type="button"
								data-mobile-nav-close
								className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
								aria-label="Close navigation menu"
							>
								×
							</button>
						</div>
						<nav
							className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-5 px-4 pb-12 sm:px-6"
							aria-label="Mobile"
						>
							{SITE_HEADER_NAV_LINKS.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-3xl font-semibold tracking-[-0.03em] text-white/80 transition hover:text-white"
								>
									{link.label}
								</Link>
							))}
							<Link
								href={SITE_CONTACT_LINK.href}
								className="text-3xl font-semibold tracking-[-0.03em] text-white/80 transition hover:text-white"
							>
								{SITE_CONTACT_LINK.label}
							</Link>
							<div className="mt-6 flex flex-col gap-3 sm:max-w-sm">
								<Link
									href={SITE_AUDIT_CTA.href}
									className="inline-flex items-center justify-center rounded-full border border-sky-300/35 bg-sky-500/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white"
								>
									{SITE_AUDIT_CTA.label}
								</Link>
								<a
									href={mailtoContactHref}
									className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/85"
								>
									Email Anthony
								</a>
							</div>
						</nav>
					</div>
				</div>

				<SiteContactDrawer />
				<main id="main-content" className="relative min-h-[60vh]">
					{children}
				</main>
				{!hidePreFooterCta && footerCta ? <FooterCta {...footerCta} /> : null}
				<BrandFooter />
			</div>

			<div
				id="cookie-consent-root"
				hidden
				role="dialog"
				aria-modal="true"
				aria-labelledby="cookie-consent-title"
				aria-describedby="cookie-consent-desc"
				className="fixed inset-x-0 bottom-0 z-[105] px-4 pb-4 sm:px-6"
			>
				<div className="mx-auto max-w-3xl rounded-[28px] border border-[rgb(var(--accent-bronze-rgb)/0.24)] bg-[linear-gradient(165deg,rgba(19,26,36,0.98),rgba(8,11,18,0.99))] p-6 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
					<p
						id="cookie-consent-title"
						className="text-base font-semibold text-[var(--text-cream)]"
					>
						Cookies and analytics
					</p>
					<p
						id="cookie-consent-desc"
						className="mt-2 text-sm leading-6 text-white/65"
					>
						We use essential tools to keep forms secure and the site running. If
						you are OK with it, we also load Google Analytics 4 to see how
						traffic moves. Read the{" "}
						<Link
							href="/cookie"
							className="text-[rgb(var(--accent-bronze-rgb))] underline underline-offset-4"
						>
							Cookie Policy
						</Link>{" "}
						and{" "}
						<Link
							href="/privacy"
							className="text-[rgb(var(--accent-bronze-rgb))] underline underline-offset-4"
						>
							Privacy Policy
						</Link>
						.
					</p>
					<div className="mt-5 flex flex-wrap gap-3">
						<button
							type="button"
							className="inline-flex items-center rounded-full border border-[rgb(var(--accent-bronze-rgb)/0.5)] bg-[rgb(var(--accent-bronze-rgb)/0.9)] px-5 py-3 text-sm font-semibold text-[#171008]"
							id="cookie-consent-accept"
						>
							Accept
						</button>
						<button
							type="button"
							className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85"
							id="cookie-consent-reject"
						>
							Decline
						</button>
					</div>
				</div>
			</div>

			<Script id="cookie-consent-boot" strategy="afterInteractive">
				{`(function () {
  if (window.__dbaCookieConsentBootstrapped) return;
  window.__dbaCookieConsentBootstrapped = true;
  var key = window.__dbaCookieConsentKey || 'dba_cookie_consent';
  var root = document.getElementById('cookie-consent-root');
  var accept = document.getElementById('cookie-consent-accept');
  var reject = document.getElementById('cookie-consent-reject');
  function hide() { if (root) root.setAttribute('hidden', ''); }
  function show() {
    if (root) root.removeAttribute('hidden');
    var first = document.getElementById('cookie-consent-accept');
    if (first && typeof first.focus === 'function') {
      window.requestAnimationFrame(function () { first.focus(); });
    }
  }
  function grantAndLoad() {
    if (typeof window.__dbaGrantAnalyticsConsent === 'function') window.__dbaGrantAnalyticsConsent();
    if (typeof window.__dbaLoadAnalytics === 'function') window.__dbaLoadAnalytics();
  }
  function revokeAnalytics() {
    if (typeof window.__dbaRevokeAnalyticsConsent === 'function') window.__dbaRevokeAnalyticsConsent();
  }
  function applyStored() {
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) { stored = null; }
    if (stored === 'accepted') { grantAndLoad(); hide(); }
    else if (stored === 'rejected') { revokeAnalytics(); hide(); }
    else { revokeAnalytics(); show(); }
  }
  if (accept) {
    accept.addEventListener('click', function () {
      try { localStorage.setItem(key, 'accepted'); } catch (e) {}
      grantAndLoad(); hide();
    });
  }
  if (reject) {
    reject.addEventListener('click', function () {
      try { localStorage.setItem(key, 'rejected'); } catch (e) {}
      revokeAnalytics(); hide();
    });
  }
  window.__dbaOpenCookieConsent = function () {
    try { localStorage.removeItem(key); } catch (e) {}
    revokeAnalytics(); show();
  };
  applyStored();
})();`}
			</Script>

			<Script id="site-script-lazy-loader" strategy="afterInteractive">
				{`(function () {
  var loaded = false;
  function loadSiteScript() {
    if (loaded) return;
    loaded = true;
    var script = document.createElement("script");
    script.type = "module";
    script.src = "/scripts/site.js?v=${siteScriptVersion}";
    script.defer = true;
    document.body.appendChild(script);
  }
  var kickoff = function () {
    loadSiteScript();
    window.removeEventListener("pointerdown", kickoff);
    window.removeEventListener("keydown", kickoff);
  };
  window.addEventListener("pointerdown", kickoff, { once: true, passive: true });
  window.addEventListener("keydown", kickoff, { once: true });
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadSiteScript, { timeout: 1800 });
  } else {
    window.setTimeout(loadSiteScript, 1800);
  }
})();`}
			</Script>
		</>
	);
}
