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
import { FooterCta, type FooterCtaProps } from "./FooterCta";
import { PageLifecycle } from "./PageLifecycle";
import { SiteContactDrawer } from "./SiteContactDrawer";

/** Build-time id (see `next.config.ts` env); avoids filesystem reads on Cloudflare Workers. */
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
  // GTM already handles its own initialization once the script is loaded
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
				className="reading-progress-bar"
				aria-hidden="true"
			/>
			<div className="site-chrome-sticky">
				<BrandHeader />
			</div>

			<div
				className="mobile-nav-overlay fixed inset-0 z-[10060] flex flex-col bg-black/95"
				id="mobile-nav"
				role="dialog"
				aria-modal="true"
				aria-labelledby="mobile-nav-title"
				aria-hidden="true"
			>
				<div
					className="mobile-nav-backdrop absolute inset-0 bg-black/95"
					data-mobile-nav-dismiss
					aria-hidden="true"
				/>
				<div className="mobile-nav-scroll-wrap relative z-[1] flex flex-1 flex-col">
					<div className="mobile-nav-panel flex min-h-full w-full flex-1 flex-col">
						<div className="mobile-nav-panel__top flex items-center justify-between p-6 sm:px-8">
							<h2
								id="mobile-nav-title"
								className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72"
							>
								Main menu
							</h2>
							<button
								type="button"
								className="mobile-nav-close inline-flex h-11 w-11 items-center justify-center"
								data-mobile-nav-close
								aria-label="Close navigation menu"
							>
								<span aria-hidden="true">×</span>
							</button>
						</div>
						<nav
							className="mobile-nav-links flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10 text-center sm:px-8"
							aria-label="Mobile"
						>
							{SITE_HEADER_NAV_LINKS.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="w-full max-w-sm"
								>
									{link.label}
								</Link>
							))}
							<Link
								href={SITE_CONTACT_LINK.href}
								className="mobile-nav-cta mobile-nav-cta--secondary w-full max-w-sm"
							>
								{SITE_CONTACT_LINK.label}
							</Link>
							<Link
								href={SITE_AUDIT_CTA.href}
								className="mobile-nav-cta w-full max-w-sm"
							>
								{SITE_AUDIT_CTA.label}
							</Link>
						</nav>
					</div>
				</div>
			</div>

			<div className="site-body-canvas">
				<SiteContactDrawer />
				<div className="site-main-wrap w-full min-w-0">
					<main id="main-content" className="relative w-full min-w-0">
						{children}
					</main>
					{!hidePreFooterCta && footerCta ? <FooterCta {...footerCta} /> : null}
					<BrandFooter />
				</div>
			</div>

			<div
				id="cookie-consent-root"
				className="cookie-consent"
				hidden
				role="dialog"
				aria-modal="true"
				aria-labelledby="cookie-consent-title"
				aria-describedby="cookie-consent-desc"
			>
				<div className="cookie-consent__inner">
					<p id="cookie-consent-title" className="cookie-consent__title">
						Cookies and analytics
					</p>
					<p id="cookie-consent-desc" className="cookie-consent__text">
						We use essential tools to keep forms secure and the site running. If
						you are OK with it, we also load Google Analytics 4 to see how
						traffic moves. Read the <Link href="/cookie">Cookie Policy</Link>{" "}
						and <Link href="/privacy">Privacy Policy</Link>.
					</p>
					<div className="cookie-consent__actions">
						<button
							type="button"
							className="btn btn-primary btn-sm"
							id="cookie-consent-accept"
						>
							Accept
						</button>
						<button
							type="button"
							className="btn btn-outline btn-sm"
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
