import { buildPublicLeadPayloadFromFormData } from "@/lib/lead-form-contract";
import { pushAnalyticsEvent, requestGaClientId } from "./analytics";

/**
 * Lead endpoint resolution (marketing audit/contact-style forms):
 *   1. Form `action` URL when it is a trusted target (same-origin `/api/*`,
 *      first-party API `/api/*`, or Convex `*.convex.site/webhook/*`).
 *   2. `NEXT_PUBLIC_LEAD_WEBHOOK_URL` when `action` is missing (build-time).
 *   3. Fallback: managed Convex lead webhook.
 */
const FALLBACK_FORM_ENDPOINT =
	"https://tremendous-emu-522.convex.site/webhook/lead";

function readDefaultLeadEndpoint(): string {
	/** `site.js` is esbuild-bundled; read URL from `<html data-lead-webhook>` (set in `layout.tsx`). */
	if (typeof document !== "undefined") {
		const fromDom =
			document.documentElement?.dataset?.leadWebhook?.trim() ?? "";
		if (fromDom) return fromDom;
	}
	const fromEnv =
		typeof process !== "undefined" &&
		typeof process.env?.NEXT_PUBLIC_LEAD_WEBHOOK_URL === "string"
			? process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL.trim()
			: "";
	return fromEnv || FALLBACK_FORM_ENDPOINT;
}

const DBA_API_HOST = "api.designedbyanthony.com";
const CONVEX_WEBHOOK_HOST = "tremendous-emu-522.convex.site";

function isTrustedConvexWebhook(url: URL): boolean {
	return (
		url.protocol === "https:" &&
		(url.hostname.endsWith(".convex.site") ||
			url.hostname === CONVEX_WEBHOOK_HOST) &&
		url.pathname.startsWith("/webhook/")
	);
}

export interface AuditFormError {
	field?: string;
	message?: string;
}

export interface AuditFormResponse {
	errors?: AuditFormError[];
	ok?: boolean;
}

function resolveFormEndpoint(rawEndpoint: string | null | undefined): string {
	const defaultEndpoint = readDefaultLeadEndpoint();
	const candidate = rawEndpoint?.trim() || defaultEndpoint;

	try {
		const url = new URL(candidate, window.location.origin);
		const isSameOriginApi =
			url.origin === window.location.origin && url.pathname.startsWith("/api/");

		const isDbaApi =
			url.hostname === DBA_API_HOST && url.pathname.startsWith("/api/");
		if (isSameOriginApi || isDbaApi || isTrustedConvexWebhook(url)) {
			return url.toString();
		}
		return defaultEndpoint;
	} catch {
		return defaultEndpoint;
	}
}

export function resetAuditFormState(
	form: HTMLFormElement,
	{ force = false } = {},
): void {
	const successPanel = form.querySelector<HTMLElement>("[data-form-success]");
	const shell = form.querySelector<HTMLElement>("[data-form-shell]");
	const actions = form.querySelector<HTMLElement>("[data-form-actions]");
	const errorBox = form.querySelector<HTMLElement>("[data-form-error]");
	const submitButton =
		form.querySelector<HTMLButtonElement>("[data-form-submit]");
	const succeeded = form.dataset.formSucceeded === "true";

	if (!force && !succeeded) return;

	form.reset();
	form.dataset.formSucceeded = "false";

	shell?.removeAttribute("hidden");
	actions?.removeAttribute("hidden");
	errorBox?.setAttribute("hidden", "");
	if (errorBox) errorBox.textContent = "";
	successPanel?.setAttribute("hidden", "");

	form
		.querySelectorAll<HTMLElement>("[data-field-error]")
		.forEach((element) => {
			element.textContent = "";
		});

	form
		.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
		.forEach((field) => {
			field.removeAttribute("aria-invalid");
		});

	if (submitButton) {
		submitButton.disabled = false;
		submitButton.textContent =
			submitButton.dataset.defaultLabel || submitButton.textContent || "";
	}

	setAuditHiddenField(form, "source_page", window.location.pathname);
	setAuditHiddenField(form, "page_url", window.location.href);
	setAuditHiddenField(form, "referrer_url", document.referrer || "direct");
	setAuditHiddenField(form, "page_title", document.title);

	void syncGaClientId(form);
}

function clearAuditFormErrors(form: HTMLFormElement): void {
	const errorBox = form.querySelector<HTMLElement>("[data-form-error]");

	form
		.querySelectorAll<HTMLElement>("[data-field-error]")
		.forEach((element) => {
			element.textContent = "";
		});

	form
		.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
		.forEach((field) => {
			field.removeAttribute("aria-invalid");
		});

	if (errorBox) {
		errorBox.textContent = "";
		errorBox.setAttribute("hidden", "");
	}
}

function setAuditFieldError(
	form: HTMLFormElement,
	fieldName: string,
	message: string,
): void {
	const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
		`[name="${fieldName}"]`,
	);
	const errorSlot = form.querySelector<HTMLElement>(
		`[data-field-error="${fieldName}"]`,
	);

	field?.setAttribute("aria-invalid", "true");
	if (errorSlot) {
		errorSlot.textContent = message;
	}
}

function showAuditFormError(form: HTMLFormElement, message: string): void {
	const errorBox = form.querySelector<HTMLElement>("[data-form-error]");

	if (!errorBox) return;

	errorBox.textContent = message;
	errorBox.removeAttribute("hidden");
}

function restoreAuditSubmitButton(
	submitButton: HTMLButtonElement | null,
	defaultLabel: string,
): void {
	if (!submitButton) return;

	submitButton.disabled = false;
	submitButton.textContent = defaultLabel;
}

function setAuditHiddenField(
	form: HTMLFormElement,
	name: string,
	value: string,
): void {
	const field = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
	if (!field) return;
	field.value = value;
}

async function syncGaClientId(form: HTMLFormElement): Promise<void> {
	const clientId = await requestGaClientId();
	if (!clientId) return;
	setAuditHiddenField(form, "ga_client_id", clientId);
}

function trackAuditFormStart(form: HTMLFormElement): void {
	if (form.dataset.formStarted === "true") return;

	form.dataset.formStarted = "true";

	const pageContext =
		form.querySelector<HTMLInputElement>('input[name="page_context"]')?.value ||
		"unknown";
	const ctaSource =
		form.querySelector<HTMLInputElement>('input[name="cta_source"]')?.value ||
		"unknown";
	const leadSource = form.querySelector<HTMLInputElement>(
		'input[name="lead_source"]',
	)?.value;
	const pageTitle =
		form.querySelector<HTMLInputElement>('input[name="page_title"]')?.value ||
		document.title;
	const pageUrl =
		form.querySelector<HTMLInputElement>('input[name="page_url"]')?.value ||
		window.location.href;

	pushAnalyticsEvent("audit_form_start", {
		cta_source: ctaSource,
		source_page: window.location.pathname,
		page_context: pageContext,
		page_title: pageTitle,
		page_url: pageUrl,
		...(leadSource ? { lead_source: leadSource } : {}),
	});

	if (pageContext === "facebook_offer_landing") {
		pushAnalyticsEvent("facebook_offer_form_start", {
			cta_source: ctaSource,
			source_page: window.location.pathname,
			offer_type:
				form.querySelector<HTMLInputElement>('input[name="offer_type"]')
					?.value || "unknown",
		});
	}
}

function handleAuditSuccess(form: HTMLFormElement): void {
	const successMode = form.dataset.successMode || "inline";
	const pageContext =
		form.querySelector<HTMLInputElement>('input[name="page_context"]')?.value ||
		"unknown";
	const ctaSource =
		form.querySelector<HTMLInputElement>('input[name="cta_source"]')?.value ||
		"unknown";
	const offerType =
		form.querySelector<HTMLInputElement>('input[name="offer_type"]')?.value ||
		"unknown";
	const leadSource = form.querySelector<HTMLInputElement>(
		'input[name="lead_source"]',
	)?.value;
	const pageTitle =
		form.querySelector<HTMLInputElement>('input[name="page_title"]')?.value ||
		document.title;
	const gaClientId =
		form.querySelector<HTMLInputElement>('input[name="ga_client_id"]')?.value ||
		undefined;
	const pageUrl =
		form.querySelector<HTMLInputElement>('input[name="page_url"]')?.value ||
		window.location.href;

	pushAnalyticsEvent("audit_form_submit", {
		cta_source: ctaSource,
		source_page: window.location.pathname,
		page_context: pageContext,
		page_title: pageTitle,
		page_url: pageUrl,
		ga_client_id: gaClientId,
		...(leadSource ? { lead_source: leadSource } : {}),
	});

	pushAnalyticsEvent("generate_lead", {
		cta_source: ctaSource,
		source_page: window.location.pathname,
		page_context: pageContext,
		lead_type: offerType,
		form_name: "audit_form",
		page_title: pageTitle,
		page_url: pageUrl,
		ga_client_id: gaClientId,
		...(leadSource ? { lead_source: leadSource } : {}),
	});

	if (pageContext === "facebook_offer_landing") {
		pushAnalyticsEvent("facebook_offer_submit", {
			cta_source: ctaSource,
			source_page: window.location.pathname,
			offer_type: offerType,
			form_endpoint: form.getAttribute("action") || readDefaultLeadEndpoint(),
		});
	}

	const submitButton =
		form.querySelector<HTMLButtonElement>("[data-form-submit]");
	if (submitButton) {
		submitButton.textContent = "Request Received!";
		submitButton.classList.add("audit-submit-success");
		submitButton.disabled = true;
	}

	if (successMode === "redirect") {
		const redirectTarget =
			form.dataset.successRedirect || "/thank-you?offer=audit";
		setTimeout(() => window.location.assign(redirectTarget), 1200);
		return;
	}

	const shell = form.querySelector<HTMLElement>("[data-form-shell]");
	const actions = form.querySelector<HTMLElement>("[data-form-actions]");
	const successPanel = form.querySelector<HTMLElement>("[data-form-success]");

	setTimeout(() => {
		shell?.setAttribute("hidden", "");
		actions?.setAttribute("hidden", "");
		successPanel?.removeAttribute("hidden");
		form.dataset.formSucceeded = "true";
	}, 1200);
}

export function initFacebookOfferTracking(): void {
	if (!document.body.classList.contains("facebook-offer-page")) return;

	const focusFacebookOfferForm = () => {
		window.setTimeout(() => {
			const firstField = document.querySelector<
				HTMLInputElement | HTMLTextAreaElement
			>(
				'#claim-offer input:not([type="hidden"]):not([tabindex="-1"]), #claim-offer textarea',
			);

			firstField?.focus({ preventScroll: true });
		}, 220);
	};

	pushAnalyticsEvent("facebook_offer_view", {
		source_page: window.location.pathname,
		page_context: "facebook_offer_landing",
		page_url: window.location.href,
		referrer_url: document.referrer || "direct",
	});

	const ctas = Array.from(
		document.querySelectorAll<HTMLAnchorElement>("[data-facebook-offer-cta]"),
	);
	ctas.forEach((cta) => {
		cta.addEventListener("click", () => {
			pushAnalyticsEvent("facebook_offer_cta_click", {
				source_page: window.location.pathname,
				cta_source: cta.dataset.facebookOfferCta || "unknown",
				cta_label: (cta.textContent || "").trim(),
				cta_target: cta.getAttribute("href") || "unknown",
			});

			if (cta.getAttribute("href") === "#claim-offer") {
				focusFacebookOfferForm();
			}
		});
	});

	if (window.location.hash === "#claim-offer") {
		focusFacebookOfferForm();
	}
}

async function finalizeAuditFormSubmission(
	form: HTMLFormElement,
): Promise<void> {
	const submitButton =
		form.querySelector<HTMLButtonElement>("[data-form-submit]");
	const defaultLabel =
		submitButton?.dataset.defaultLabel || "Send My Audit Request";
	const endpoint = resolveFormEndpoint(form.getAttribute("action"));

	if (submitButton) {
		submitButton.disabled = true;
		submitButton.textContent = "Sending...";
	}

	const formData = new FormData(form);
	formData.set("source_page", window.location.pathname);
	formData.set("page_url", window.location.href);
	formData.set("referrer_url", document.referrer || "direct");
	formData.set("page_title", document.title);

	const payload = buildPublicLeadPayloadFromFormData(formData);

	// Read the Augusta tenant id off the form (data attribute) so a single
	// marketing codebase can represent any tenant in the future.
	const tenantId = form.dataset.tenantId?.trim();
	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	if (tenantId) headers["X-Tenant-Id"] = tenantId;

	try {
		// nosemgrep: nodejs_scan.javascript-ssrf-rule-node_ssrf
		const response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});

		const data = (await response
			.json()
			.catch(() => ({}))) as AuditFormResponse & { error?: string };

		if (!response.ok) {
			const errMsg =
				(typeof data.error === "string" && data.error) ||
				(Array.isArray(data.errors) && data.errors[0]?.message) ||
				"";

			if (Array.isArray(data.errors) && data.errors.length > 0) {
				data.errors.forEach((error) => {
					if (error.field && error.message) {
						setAuditFieldError(form, error.field, error.message);
					}
				});

				if (data.errors.every((error) => !error.field)) {
					showAuditFormError(
						form,
						errMsg || "Something went wrong. Please try again.",
					);
				}
			} else {
				showAuditFormError(
					form,
					errMsg ||
						"Something went wrong while sending your request. Please try again.",
				);
			}

			restoreAuditSubmitButton(submitButton, defaultLabel);
			return;
		}

		handleAuditSuccess(form);
	} catch {
		showAuditFormError(
			form,
			"We could not submit the form right now. Please try again in a moment.",
		);
		restoreAuditSubmitButton(submitButton, defaultLabel);
	}
}

/**
 * Submit handler for the legacy marketing audit/contact forms.
 * No client-side captcha: the previous reCAPTCHA Enterprise step was
 * removed in the round-2 hotfix pass.
 */
async function submitAuditForm(form: HTMLFormElement): Promise<void> {
	const submitButton =
		form.querySelector<HTMLButtonElement>("[data-form-submit]");
	const defaultLabel =
		submitButton?.textContent?.trim() || "Send My Audit Request";
	if (submitButton) {
		submitButton.dataset.defaultLabel = defaultLabel;
		submitButton.disabled = true;
		submitButton.textContent = "Sending...";
	}

	clearAuditFormErrors(form);
	await syncGaClientId(form);

	await finalizeAuditFormSubmission(form);
}

function determineLeadSource(pathname: string): string {
	if (pathname.startsWith("/services/")) return "service_page";
	if (pathname === "/services") return "services_index";
	if (pathname === "/lighthouse" || pathname.startsWith("/lighthouse/"))
		return "audit_page";
	if (pathname === "/contact") return "contact_page";
	if (pathname === "/") return "home_page";
	if (pathname.startsWith("/blog/")) return "blog_page";
	if (pathname.startsWith("/portfolio/")) return "portfolio_page";
	return "other";
}

function setAuditTrackingFields(form: HTMLFormElement): void {
	const pathname = window.location.pathname;
	const leadSource = determineLeadSource(pathname);

	setAuditHiddenField(form, "source_page", pathname);
	setAuditHiddenField(form, "lead_source", leadSource);
	setAuditHiddenField(form, "page_url", window.location.href);
	setAuditHiddenField(form, "referrer_url", document.referrer || "direct");
	setAuditHiddenField(form, "page_title", document.title);
	void syncGaClientId(form);
}

export function initAuditForms(): {
	resetAllSuccessStates: (container?: ParentNode) => void;
} {
	const forms = Array.from(
		document.querySelectorAll<HTMLFormElement>("[data-audit-form]"),
	);

	forms.forEach((form) => {
		setAuditTrackingFields(form);

		const startHandler = (event: Event) => {
			const target = event.target;
			if (
				!(target instanceof HTMLInputElement) &&
				!(target instanceof HTMLTextAreaElement) &&
				!(target instanceof HTMLSelectElement)
			) {
				return;
			}

			if (target.type === "hidden") return;
			trackAuditFormStart(form);
		};

		form.addEventListener("focusin", startHandler);
		form.addEventListener("input", startHandler);

		form.addEventListener("submit", (event) => {
			event.preventDefault();
			void submitAuditForm(form);
		});
	});

	return {
		resetAllSuccessStates: (container?: ParentNode) => {
			const scope = container ?? document;
			scope
				.querySelectorAll<HTMLFormElement>("[data-audit-form]")
				.forEach((form) => {
					resetAuditFormState(form);
				});
		},
	};
}
