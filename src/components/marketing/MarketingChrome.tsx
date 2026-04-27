import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import { BRAND_MARK_IMAGE } from "@/design-system/brand";
import { businessProfile, GA_MEASUREMENT_ID } from "@/lib/seo";
import { FooterCta, type FooterCtaProps } from "./FooterCta";
import { PageLifecycle } from "./PageLifecycle";
import { SiteContactDrawer } from "./SiteContactDrawer";
import { SiteFooter } from "./SiteFooter";
import { StreamChatGate } from "./StreamChatGate";

const mailtoContactHref = `mailto:${businessProfile.email}?subject=${encodeURIComponent("Website inquiry — Designed by Anthony")}`;

let siteScriptVersion = "dev";
try {
	siteScriptVersion = createHash("sha256")
		.update(readFileSync(join(process.cwd(), "public/scripts/site.js")))
		.digest("hex")
		.slice(0, 12);
} catch {
	/* preview without built script */
}

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
var analyticsLoaded = false;
var analyticsConfigured = false;
window.__dbaCookieConsentKey = 'dba_cookie_consent';
function configureAnalytics() {
  if (analyticsConfigured) return;
  analyticsConfigured = true;
  window.gtag('js', new Date());
  window.gtag('config', '${GA_MEASUREMENT_ID}', {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: true,
  });
}
window.__dbaLoadAnalytics = function () {
  if (analyticsLoaded) { configureAnalytics(); return; }
  analyticsLoaded = true;
  if (document.getElementById('dba-ga4-loader')) { configureAnalytics(); return; }
  var script = document.createElement('script');
  script.id = 'dba-ga4-loader';
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent('${GA_MEASUREMENT_ID}');
  script.onload = configureAnalytics;
  document.head.appendChild(script);
};
window.__dbaGrantAnalyticsConsent = function () {
  window.__dbaAnalyticsEnabled = true;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
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

			<div id="reading-progress-bar" aria-hidden="true" />
			<div className="site-chrome-sticky">
				<div className="site-banner">
					<Link href="/lighthouse" className="site-banner-link">
						<span className="site-banner-dot" aria-hidden="true" />
						<span>
							<strong>Launch pilot · 10 founding spots</strong> — start with a
							free SEO + performance audit →
						</span>
					</Link>
				</div>
				<header className="header">
					<div className="header-container">
						<Link href="/" className="brand-lockup">
							<Image
								src={BRAND_MARK_IMAGE}
								alt="Designed by Anthony"
								width={BRAND_MARK_IMAGE.width}
								height={BRAND_MARK_IMAGE.height}
								className="nav-icon"
								priority
							/>
						</Link>
						<nav className="nav nav-desktop" aria-label="Primary">
							<Link href="/ouredge">Our Edge</Link>
							<Link href="/services">Services</Link>
							<Link href="/portfolio">Portfolio</Link>
							<Link href="/pricing">Pricing</Link>
							<Link href="/service-areas">Service Areas</Link>
							<Link href="/about">About</Link>
							<Link href="/faq">FAQ</Link>
							<Link href="/blog">Blog</Link>
							<Link href="/contact" className="nav-contact-link">
								Contact
							</Link>
							<Link
								href="/lighthouse"
								className="btn btn-primary btn-sm nav-book-btn"
								id="nav-audit-btn"
							>
								Audit My Site
							</Link>
						</nav>
						<button
							className="hamburger"
							id="hamburger-btn"
							type="button"
							aria-label="Open navigation menu"
							aria-controls="mobile-nav"
							aria-expanded="false"
						>
							<span className="hamburger-line" />
							<span className="hamburger-line" />
							<span className="hamburger-line" />
						</button>
					</div>
				</header>
			</div>

			<div
				className="mobile-nav-overlay"
				id="mobile-nav"
				role="dialog"
				aria-modal="true"
				aria-labelledby="mobile-nav-title"
				aria-hidden="true"
			>
				<div
					className="mobile-nav-backdrop"
					data-mobile-nav-dismiss
					aria-hidden="true"
				/>
				<div className="mobile-nav-scroll-wrap">
					<div className="mobile-nav-panel">
						<div className="mobile-nav-panel__top">
							<h2 id="mobile-nav-title" className="sr-only">
								Main menu
							</h2>
							<button
								type="button"
								className="mobile-nav-close"
								data-mobile-nav-close
								aria-label="Close navigation menu"
							>
								<span aria-hidden="true">×</span>
							</button>
						</div>
						<nav className="mobile-nav-links" aria-label="Mobile">
							<Link href="/ouredge">Our Edge</Link>
							<Link href="/services">Services</Link>
							<Link href="/pricing">Pricing</Link>
							<Link href="/service-areas">Service Areas</Link>
							<Link href="/portfolio">Portfolio</Link>
							<Link href="/about">About</Link>
							<Link href="/faq">FAQ</Link>
							<Link href="/blog">Blog</Link>
							<Link href="/contact">Contact</Link>
							<Link
								href="/contact"
								className="mobile-nav-cta mobile-nav-cta--secondary"
							>
								Contact us
							</Link>
							<Link href="/lighthouse" className="mobile-nav-cta">
								Audit My Site
							</Link>
						</nav>
					</div>
				</div>
			</div>

			<div className="site-body-canvas">
				<SiteContactDrawer />
				<div className="site-main-wrap">
					<main id="main-content">{children}</main>
					{!hidePreFooterCta && footerCta ? <FooterCta {...footerCta} /> : null}
					<SiteFooter />
				</div>
			</div>

			<div className="reach-out-sticky" id="reachOutSticky">
				<button
					type="button"
					className="reach-out-sticky-btn"
					id="reachOutOpenBtn"
					aria-haspopup="dialog"
					aria-controls="reachOutModal"
					aria-expanded="false"
				>
					<span className="reach-out-sticky-label">Get in touch</span>
				</button>
			</div>

			<dialog
				id="reachOutModal"
				className="reach-out-dialog"
				aria-labelledby="reachOutModalTitle"
				aria-modal="true"
			>
				<div className="reach-out-dialog-panel splash-shell splash-shell--reach-out">
					<div className="reach-out-dialog-header">
						<Image
							src={BRAND_MARK_IMAGE}
							alt="Designed by Anthony"
							width={BRAND_MARK_IMAGE.width}
							height={BRAND_MARK_IMAGE.height}
							className="reach-out-dialog-logo"
						/>
						<button
							type="button"
							className="reach-out-dialog-close splash-close"
							data-reach-out-close
							aria-label="Close"
						>
							×
						</button>
					</div>
					<h2 id="reachOutModalTitle" className="reach-out-dialog-title">
						Say hello
					</h2>
					<p className="reach-out-dialog-lede">
						Start with a free site audit — or just call / email.
					</p>
					<Link
						href="/lighthouse"
						className="reach-out-dialog-primary"
						data-reach-out-close
					>
						Audit My Site
					</Link>
					<section
						className="reach-out-dialog-actions"
						aria-label="Other ways to reach us"
					>
						<a
							href={businessProfile.telephoneHref}
							className="reach-out-action"
							data-reach-out-close
						>
							<span className="reach-out-action-label">Call</span>
							<span className="reach-out-action-detail">
								{businessProfile.telephone.replace("+1-", "")}
							</span>
						</a>
						<a
							href={mailtoContactHref}
							className="reach-out-action"
							data-reach-out-close
						>
							<span className="reach-out-action-label">Email</span>
							<span className="reach-out-action-detail">
								{businessProfile.email}
							</span>
						</a>
						<Link
							href="/contact"
							className="reach-out-action"
							data-reach-out-close
						>
							<span className="reach-out-action-label">Contact</span>
							<span className="reach-out-action-detail">Form / message</span>
						</Link>
					</section>
				</div>
			</dialog>

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

			<Script id="recaptcha-enterprise-lazy" strategy="afterInteractive">
				{`(function() {
  function siteKey() {
    return document.documentElement.getAttribute('data-recaptcha-site-key') || '';
  }
  var loaded = false;
  function injectRecaptcha() {
    var k = siteKey();
    if (!k || loaded) return;
    loaded = true;
    if (document.getElementById('dba-recaptcha-enterprise-loader')) return;
    var script = document.createElement('script');
    script.id = 'dba-recaptcha-enterprise-loader';
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=' + encodeURIComponent(k);
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  function maybeLoad(target) {
    if (!siteKey()) return;
    if (!target || !(target instanceof Element)) return;
    if (!target.closest('[data-audit-form]')) return;
    injectRecaptcha();
  }
  function bind() {
    if (!siteKey()) return;
    document.addEventListener('focusin', function (e) { maybeLoad(e.target); }, { passive: true });
    document.addEventListener('pointerdown', function (e) { maybeLoad(e.target); }, { passive: true });
  }
  document.addEventListener('DOMContentLoaded', bind, { once: true });
  if (document.readyState !== 'loading') bind();
})();`}
			</Script>

			<Script id="turnstile-lazy" strategy="afterInteractive">
				{`(function() {
  if (document.documentElement.getAttribute('data-recaptcha-site-key')) return;
  window.__dbaTurnstileError = function () { document.querySelectorAll('.cf-turnstile').forEach(function (w) { var form = w.closest('[data-audit-form]'); if (form) { var box = form.querySelector('[data-form-error]'); if (box) { box.textContent = 'Security check could not load. Refresh the page.'; box.removeAttribute('hidden'); } } }); };
  var turnstileLoaded = false;
  function injectTurnstileScript() {
    if (turnstileLoaded) return;
    turnstileLoaded = true;
    if (document.getElementById('dba-turnstile-loader')) return;
    var script = document.createElement('script');
    script.id = 'dba-turnstile-loader';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }
  function maybeLoadTurnstile(target) {
    if (!document.querySelector('.cf-turnstile')) return;
    if (!target) return;
    var host = target instanceof Element ? target.closest('[data-audit-form]') : null;
    if (!host) return;
    injectTurnstileScript();
  }
  var bound = false;
  function bind() {
    if (bound) return;
    if (!document.querySelector('.cf-turnstile')) return;
    bound = true;
    document.addEventListener('focusin', function (e) { maybeLoadTurnstile(e.target); });
    document.addEventListener('pointerdown', function (e) { maybeLoadTurnstile(e.target); });
  }
  document.addEventListener('DOMContentLoaded', bind, { once: true });
  if (document.readyState !== 'loading') bind();
})();`}
			</Script>

			<StreamChatGate />
		</>
	);
}
