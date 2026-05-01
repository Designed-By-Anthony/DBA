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

const mailtoContactHref = `mailto:${businessProfile.email}?subject=${encodeURIComponent("Website inquiry — ANTHONY.")}`;

/** Build-time id (see `next.config.ts` env); avoids filesystem reads on Cloudflare Workers. */
const siteScriptVersion =
	process.env.NEXT_PUBLIC_SITE_SCRIPT_BUILD_ID ?? "local";

/* ── Shared chrome utility classes (Midnight & Bronze, inline Tailwind v4) ── */

/* Cookie consent buttons — bronze primary, ink outline */
const cookieBtnBase =
	"inline-flex items-center justify-center gap-[0.45rem] rounded-full font-[family-name:var(--font-display,'Outfit_Variable')] font-bold text-[0.78rem] tracking-[0.01em] leading-none cursor-pointer transition-[transform,box-shadow,border-color,background,color] duration-[350ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(212,175,55,0.5)] focus-visible:outline-offset-[3px] active:scale-[0.97] py-[0.55rem] px-[1.1rem]";
const cookieBtnPrimary = `${cookieBtnBase} text-[#171008] border border-[rgba(212,175,55,0.78)] bg-[linear-gradient(180deg,#fcf0d2_0%,#D4AF37_100%)] shadow-[0_18px_34px_-22px_rgba(181,138,20,0.85),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-px hover:border-[rgba(212,175,55,0.95)] hover:bg-[linear-gradient(180deg,#fff5dc_0%,#d4af37_100%)]`;
const cookieBtnOutline = `${cookieBtnBase} text-[rgba(247,244,238,0.92)] bg-[rgba(9,15,28,0.45)] border border-[rgba(226,232,240,0.5)] hover:-translate-y-px hover:border-[rgba(212,175,55,0.55)] hover:bg-[rgba(9,15,28,0.65)] hover:text-[rgba(252,240,210,0.96)]`;

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

			<div id="reading-progress-bar" aria-hidden="true" />
			<div className="site-chrome-sticky sticky top-0 z-[100] shadow-[0_12px_32px_rgba(3,7,18,0.34)]">
				<BrandHeader />
			</div>

			{/* Mobile nav overlay — `mobile-nav-overlay` + `open` are JS hooks (mobile-nav.ts). */}
			<div
				className="mobile-nav-overlay fixed inset-0 z-[200] flex flex-col h-[100dvh] max-h-[100dvh] box-border opacity-0 invisible pointer-events-none transition-[opacity,visibility] duration-[350ms] ease-out [&.open]:opacity-100 [&.open]:visible [&.open]:pointer-events-auto print:hidden"
				style={{
					padding:
						"env(safe-area-inset-top,0) env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0)",
				}}
				id="mobile-nav"
				role="dialog"
				aria-modal="true"
				aria-labelledby="mobile-nav-title"
				aria-hidden="true"
			>
				<div
					className="absolute inset-0 z-0 bg-[rgba(8,12,20,0.92)] backdrop-blur-[20px] [touch-action:none]"
					data-mobile-nav-dismiss
					aria-hidden="true"
				/>
				<div className="relative z-[1] flex-1 min-h-0 flex items-center justify-center overflow-y-auto overflow-x-hidden [overscroll-behavior:contain] [-webkit-overflow-scrolling:touch] py-3 px-4 pb-5">
					<div className="w-[min(100%,22rem)] max-h-[min(85dvh,100%)] flex flex-col min-h-0">
						<div className="flex justify-end mb-2 shrink-0">
							<h2 id="mobile-nav-title" className="sr-only">
								Main menu
							</h2>
							<button
								type="button"
								className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[rgba(255,252,245,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(247,244,238,0.92)] text-[1.65rem] font-light leading-none cursor-pointer transition-[background,border-color,color] duration-200 hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(212,175,55,0.45)] hover:text-[rgba(252,240,210,0.96)]"
								data-mobile-nav-close
								aria-label="Close navigation menu"
							>
								<span aria-hidden="true">×</span>
							</button>
						</div>
						<nav
							className="flex flex-col items-center gap-8 flex-1 min-h-0 overflow-y-auto [overscroll-behavior:contain] [-webkit-overflow-scrolling:touch] pb-2 [&_a]:text-2xl [&_a]:font-bold [&_a]:text-white/70 [&_a]:uppercase [&_a]:tracking-[0.08em] [&_a]:transition-colors [&_a]:duration-200 [&_a]:no-underline [&_a:hover]:text-[rgba(247,244,238,0.98)]"
							aria-label="Mobile"
						>
							{SITE_HEADER_NAV_LINKS.map((link) => (
								<Link key={link.href} href={link.href}>
									{link.label}
								</Link>
							))}
							<Link
								href={SITE_CONTACT_LINK.href}
								className="!mt-2 !bg-transparent !border !border-white/15 !text-white/85 !rounded-full !px-10 !py-4 !text-base !tracking-[0.06em] !shadow-none hover:!border-[rgba(212,175,55,0.45)] hover:!text-[rgba(252,240,210,0.96)]"
							>
								{SITE_CONTACT_LINK.label}
							</Link>
							<Link
								href={SITE_AUDIT_CTA.href}
								className="!mt-4 !bg-[linear-gradient(135deg,rgba(212,175,55,0.28)_0%,rgba(181,138,20,0.42)_100%)] !border !border-[rgba(212,175,55,0.5)] !text-[rgba(252,240,210,0.96)] !rounded-full !px-10 !py-4 !text-base !tracking-[0.06em] !shadow-[0_8px_24px_-4px_rgba(212,175,55,0.3)] hover:!brightness-110"
							>
								{SITE_AUDIT_CTA.label}
							</Link>
						</nav>
					</div>
				</div>
			</div>

			<div className="site-body-canvas block min-w-0">
				<SiteContactDrawer />
				<div className="min-w-0">
					<main id="main-content">{children}</main>
					{!hidePreFooterCta && footerCta ? <FooterCta {...footerCta} /> : null}
					<BrandFooter />
				</div>
			</div>

			{/* Sticky "Get in touch" side tab — Bronze-locked (was legacy blue) */}
			<div
				className="reach-out-sticky fixed right-0 top-1/2 z-[150] pointer-events-none translate-x-full -translate-y-1/2 opacity-0 invisible transition-[transform,opacity,visibility] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [&.reach-out-sticky--visible]:translate-x-0 [&.reach-out-sticky--visible]:opacity-100 [&.reach-out-sticky--visible]:visible max-md:top-auto max-md:bottom-[5.5rem] max-md:translate-x-full max-md:translate-y-0 max-md:[&.reach-out-sticky--visible]:translate-x-0 max-md:[&.reach-out-sticky--visible]:translate-y-0 print:hidden"
				id="reachOutSticky"
			>
				<button
					type="button"
					className="pointer-events-auto inline-flex items-center justify-center gap-[0.45rem] py-[0.7rem] px-[1.1rem] [writing-mode:vertical-rl] [text-orientation:mixed] border border-r-0 border-[rgba(212,175,55,0.55)] rounded-l-[0.75rem] bg-[linear-gradient(180deg,rgba(212,175,55,0.32)_0%,rgba(181,138,20,0.95)_100%)] text-[rgba(252,240,210,0.98)] text-[0.78rem] font-extrabold tracking-[0.1em] uppercase font-[family-name:var(--font-display,'Outfit_Variable')] cursor-pointer shadow-[-6px_0_24px_rgba(0,0,0,0.3),-4px_0_18px_-8px_rgba(212,175,55,0.65),inset_1px_0_0_rgba(255,255,255,0.18)] transition-[background,box-shadow,border-color,transform] duration-[250ms] ease-out hover:bg-[linear-gradient(180deg,rgba(232,213,168,0.36)_0%,rgba(155,110,15,1)_100%)] hover:border-[rgba(232,213,168,0.78)] hover:-translate-x-[3px] hover:shadow-[-10px_0_32px_rgba(0,0,0,0.35),-6px_0_24px_-8px_rgba(212,175,55,0.85),inset_1px_0_0_rgba(255,255,255,0.22)] active:-translate-x-[1px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(212,175,55,0.45)] focus-visible:outline-offset-[3px] max-md:text-[0.72rem] max-md:py-[0.6rem] max-md:px-[0.85rem]"
					id="reachOutOpenBtn"
					aria-haspopup="dialog"
					aria-controls="reachOutModal"
					aria-expanded="false"
				>
					<span>Get in touch</span>
				</button>
			</div>

			<dialog
				id="reachOutModal"
				className="reach-out-dialog fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 m-0 p-0 w-[min(440px,94vw)] max-w-[min(440px,94vw)] max-h-[min(90dvh,640px)] rounded-2xl bg-transparent border-0 overflow-auto [overscroll-behavior:contain] [&::backdrop]:bg-[rgba(5,8,14,0.82)] [&::backdrop]:backdrop-blur-[12px] [&[open]]:animate-[reach-out-dialog-in_0.32s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:[&[open]]:animate-[reach-out-dialog-in-fade_0.2s_ease_both] print:hidden"
				aria-labelledby="reachOutModalTitle"
				aria-modal="true"
			>
				<div className="rounded-2xl bg-[linear-gradient(165deg,rgba(19,26,36,0.96)_0%,rgba(8,11,18,0.99)_100%)] border border-[rgba(255,252,245,0.1)] shadow-[0_32px_90px_-40px_rgba(0,0,0,0.88),0_0_0_1px_rgba(255,252,245,0.06)] backdrop-blur-[20px] text-[rgba(247,244,238,0.92)] px-[1.35rem] pt-[1.25rem] pb-[1.15rem]">
					<div className="flex items-start justify-between gap-3 mb-[0.35rem]">
						{/* biome-ignore lint/performance/noImgElement: Direct SVG wordmark keeps the bronze period locked to the master asset. */}
						<img
							src="/logos/anthony_master_wordmark.svg"
							alt="ANTHONY."
							className="block h-9 w-auto max-w-[min(240px,85vw)]"
						/>
						<button
							type="button"
							className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(255,252,245,0.14)] bg-[rgba(255,255,255,0.08)] backdrop-blur-[14px] text-[rgba(247,244,238,0.88)] text-[1.45rem] font-light leading-none cursor-pointer transition-[background,color,border-color] duration-200 hover:bg-[rgba(255,255,255,0.14)] hover:text-[rgba(252,240,210,0.96)] hover:border-[rgba(255,252,245,0.22)] focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-[rgba(212,175,55,0.45)] focus-visible:outline-offset-2"
							data-reach-out-close
							aria-label="Close"
						>
							×
						</button>
					</div>
					<h2
						id="reachOutModalTitle"
						className="m-0 mb-[0.45rem] text-[1.35rem] font-extrabold tracking-[-0.02em] text-[rgba(252,240,210,0.96)] font-[family-name:var(--font-display,'Outfit_Variable')]"
					>
						Say hello
					</h2>
					<p className="m-0 mb-[1.1rem] text-[0.92rem] leading-[1.5] text-[#9ca3ae]">
						Start with a free site audit — or just call / email.
					</p>
					<Link
						href="/lighthouse"
						className="flex items-center justify-center gap-2 w-full py-[0.95rem] px-[1.1rem] mb-[1.15rem] rounded-full border border-[rgba(212,175,55,0.72)] bg-[linear-gradient(135deg,rgba(212,175,55,0.34),rgba(181,138,20,1)),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] text-[rgba(252,240,210,0.98)] text-base font-extrabold font-[family-name:var(--font-display,'Outfit_Variable')] no-underline tracking-[0.02em] shadow-[0_22px_40px_-22px_rgba(181,138,20,0.95),inset_0_1px_0_rgba(255,255,255,0.22)] transition-[transform,box-shadow,border-color,background] duration-200 ease-out hover:bg-[linear-gradient(135deg,rgba(232,204,105,0.38),rgba(155,110,15,1)),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] hover:border-[rgba(232,213,168,0.85)] hover:-translate-y-px active:scale-[0.99]"
						data-reach-out-close
					>
						Audit My Site
					</Link>
					<section
						className="grid grid-cols-3 gap-[0.65rem] border-t border-[rgba(255,252,245,0.08)] bg-black/20 backdrop-blur-[10px] -mx-[1.35rem] -mb-[1.15rem] p-[1rem_1rem_1.1rem] rounded-b-2xl max-[420px]:grid-cols-1"
						aria-label="Other ways to reach us"
					>
						{[
							{
								href: businessProfile.telephoneHref,
								label: "Call",
								detail: businessProfile.telephone.replace("+1-", ""),
								as: "a" as const,
								external: false,
							},
							{
								href: mailtoContactHref,
								label: "Email",
								detail: businessProfile.email,
								as: "a" as const,
								external: false,
							},
							{
								href: "/contact",
								label: "Contact",
								detail: "Form / message",
								as: "link" as const,
								external: false,
							},
						].map((action) => {
							const className =
								"flex flex-col items-center gap-[0.45rem] py-2 px-1 rounded-[0.65rem] no-underline text-[rgba(247,244,238,0.92)] text-center transition-[background,transform] duration-200 ease-out min-w-0 hover:bg-white/[0.06] active:scale-[0.98] focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-[rgba(212,175,55,0.45)] focus-visible:outline-offset-2";
							const labelEl = (
								<span className="text-[0.68rem] font-extrabold uppercase tracking-[0.06em] text-[rgba(232,213,168,0.92)]">
									{action.label}
								</span>
							);
							const detailEl = (
								<span className="text-[0.72rem] font-semibold text-[rgba(252,240,210,0.96)] [word-break:break-word] leading-[1.25] max-[380px]:text-[0.65rem]">
									{action.detail}
								</span>
							);
							if (action.as === "link") {
								return (
									<Link
										key={action.label}
										href={action.href}
										className={className}
										data-reach-out-close
									>
										{labelEl}
										{detailEl}
									</Link>
								);
							}
							return (
								<a
									key={action.label}
									href={action.href}
									className={className}
									data-reach-out-close
								>
									{labelEl}
									{detailEl}
								</a>
							);
						})}
					</section>
				</div>
			</dialog>

			<div
				id="cookie-consent-root"
				className="fixed left-0 right-0 bottom-0 z-[10050] px-5 py-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] pointer-events-none print:hidden"
				hidden
				role="dialog"
				aria-modal="true"
				aria-labelledby="cookie-consent-title"
				aria-describedby="cookie-consent-desc"
			>
				<div className="pointer-events-auto max-w-[44rem] mx-auto px-6 py-5 rounded-[1.4rem] border border-[rgba(212,175,55,0.32)] bg-[linear-gradient(165deg,rgba(19,26,36,0.98)_0%,rgba(8,11,18,0.99)_100%)] backdrop-blur-[20px] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,252,245,0.06),inset_0_1px_0_rgba(255,252,245,0.08)]">
					<p
						id="cookie-consent-title"
						className="m-0 mb-2 text-base font-bold text-[rgba(252,240,210,0.96)] tracking-[-0.01em]"
					>
						Cookies and analytics
					</p>
					<p
						id="cookie-consent-desc"
						className="m-0 mb-4 text-[0.875rem] leading-[1.6] text-[#9ca3ae] [&_a]:text-[#D4AF37] [&_a]:no-underline [&_a]:border-b [&_a]:border-[rgba(212,175,55,0.4)] [&_a]:transition-[border-color] [&_a]:duration-200 [&_a:hover]:border-[#D4AF37]"
					>
						We use essential tools to keep forms secure and the site running. If
						you are OK with it, we also load Google Analytics 4 to see how
						traffic moves. Read the <Link href="/cookie">Cookie Policy</Link>{" "}
						and <Link href="/privacy">Privacy Policy</Link>.
					</p>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							className={cookieBtnPrimary}
							id="cookie-consent-accept"
						>
							Accept
						</button>
						<button
							type="button"
							className={cookieBtnOutline}
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
