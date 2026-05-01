"use client";

import { useState, useId } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { btnPrimaryAudit } from "@/design-system/buttons";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { businessProfile } from "@/lib/seo";
import { resolveEffectiveSiteKey } from "@/lib/turnstile";

export interface AuditFormProps {
	ctaSource?: string;
	pageContext?: string;
	sourcePath?: string;
	pageTitle?: string;
	/** Defaults to `/api/contact` (same-origin JSON + server webhook forward). */
	formEndpoint?: string;
	offerType?: string;
	subjectLine?: string;
	successLinkHref?: string;
	successLinkLabel?: string;
	successMode?: "inline" | "redirect";
	successRedirect?: string;
	successTag?: string;
	successTitle?: string;
	successMessage?: string;
	successPoints?: string[];
	submitLabel?: string;
	metaMessage?: string;
	websiteLabel?: string;
	websitePlaceholder?: string;
	websiteRequired?: boolean;
	issueLabel?: string;
	issuePlaceholder?: string;
	issueRequired?: boolean;
	showPhoneField?: boolean;
	issueRows?: number;
}

/* Inline Tailwind: audit-form classes (layout-shell.css), Bronze focus ring. */
const FORM =
	"grid gap-[1.1rem] relative [&_input]:w-full [&_textarea]:w-full [&_input]:py-[0.95rem] [&_input]:px-4 [&_textarea]:py-[0.95rem] [&_textarea]:px-4 [&_input]:rounded-2xl [&_textarea]:rounded-2xl [&_input]:border [&_input]:border-[rgba(226,232,240,0.5)] [&_textarea]:border [&_textarea]:border-[rgba(226,232,240,0.5)] [&_input]:bg-[rgba(8,15,28,0.78)] [&_textarea]:bg-[rgba(8,15,28,0.78)] [&_input]:text-[var(--text-white)] [&_textarea]:text-[var(--text-white)] [&_input]:font-[inherit] [&_textarea]:font-[inherit] [&_input]:transition-[border-color,box-shadow,transform] [&_textarea]:transition-[border-color,box-shadow,transform] [&_input]:duration-[250ms] [&_textarea]:duration-[250ms] [&_input::placeholder]:text-white/[0.34] [&_textarea::placeholder]:text-white/[0.34] [&_input:focus]:outline-none [&_textarea:focus]:outline-none [&_input:focus]:border-[rgba(212,175,55,0.78)] [&_textarea:focus]:border-[rgba(212,175,55,0.78)] [&_input:focus]:shadow-[0_0_0_3px_rgba(212,175,55,0.28),0_0_12px_rgba(212,175,55,0.18)] [&_textarea:focus]:shadow-[0_0_0_3px_rgba(212,175,55,0.28),0_0_12px_rgba(212,175,55,0.18)] [&_input:focus]:-translate-y-px [&_textarea:focus]:-translate-y-px [&_textarea]:resize-y [&_textarea]:min-h-[140px] [&_label]:flex [&_label]:items-center [&_label]:justify-between [&_label]:gap-3 [&_label]:text-[0.84rem] [&_label]:font-bold [&_label]:text-white/[0.86] [&_label]:tracking-[0.01em] [&_[aria-invalid='true']]:border-[rgba(248,113,113,0.8)] [&_[aria-invalid='true']]:shadow-[0_0_0_4px_rgba(248,113,113,0.14)]";
const FORM_GRID = "grid grid-cols-1 sm:grid-cols-2 gap-4";
const FIELD = "grid gap-[0.45rem]";
const FIELD_FULL = `${FIELD} col-span-full`;
const FIELD_HINT = "min-h-[1.2rem] text-[0.84rem] text-[#fca5a5] m-0";
const ACTIONS = "grid gap-[0.8rem]";
const META =
	"min-h-[1.2rem] text-[0.84rem] text-[#fca5a5] m-0 mt-[-0.15rem] text-white/54 leading-[1.65]";
const PRIVACY =
	"text-white/[0.46] text-[0.8rem] leading-[1.55] m-0 [&_a]:text-[rgba(232,213,168,0.95)]";
const STATUS = "min-h-[1.2rem] text-[0.84rem] text-[#fca5a5] m-0 mt-[-0.15rem]";
/* JS-set hook (audit-forms.ts adds .audit-submit-success on success) — handled via [&.audit-submit-success] variant in btnPrimaryAudit */
const SUBMIT_BTN = btnPrimaryAudit;

/**
 * Native marketing lead form — wired by `src/scripts/audit-forms.ts`
 * (no client-side captcha; JSON POST). Submits to `action`
 * or `/api/lead-email`, which forwards to `LEAD_WEBHOOK_URL` on the server.
 */
export function AuditForm({
	ctaSource = "marketing",
	pageContext = "unknown",
	offerType = "audit_request",
	submitLabel = "Send request",
	metaMessage = "Protected against spam.",
	successMode = "inline",
	successRedirect = "/thank-you?offer=audit",
	websiteLabel = "Website URL",
	websitePlaceholder = "https://example.com",
	websiteRequired = true,
	issueLabel = "What should we know?",
	issuePlaceholder = "Goals, timeline, or anything else helpful.",
	issueRequired = true,
	showPhoneField = false,
	issueRows = 4,
	formEndpoint,
}: AuditFormProps) {
	const formId = useId();
	const action = formEndpoint?.trim() || buildPublicApiUrl("/api/lead-email");
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const siteKey = resolveEffectiveSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
	const turnstileRequired = !!siteKey;
	const isDisabled = turnstileRequired && !turnstileToken;

	return (
		<form
			className={FORM}
			data-audit-form
			action={action}
			method="post"
			data-success-mode={successMode}
			data-success-redirect={successRedirect}
			noValidate
		>
			<input type="hidden" name="cta_source" value={ctaSource} />
			<input type="hidden" name="page_context" value={pageContext} />
			<input type="hidden" name="offer_type" value={offerType} />
			<input type="hidden" name="lead_source" value="marketing_site" />
			<input type="hidden" name="source_page" value="" />
			<input type="hidden" name="page_url" value="" />
			<input type="hidden" name="referrer_url" value="" />
			<input type="hidden" name="page_title" value="" />
			<input type="hidden" name="ga_client_id" value="" />
			{turnstileRequired && (
				<input
					type="hidden"
					name="cf_turnstile_response"
					value={turnstileToken ?? ""}
				/>
			)}
			<div data-form-shell>
				<div className={FORM_GRID}>
					<div className={FIELD}>
						<label htmlFor={`${formId}-first`}>First name</label>
						<input
							id={`${formId}-first`}
							name="first_name"
							type="text"
							autoComplete="given-name"
							required
						/>
						<p className={FIELD_HINT} data-field-error="first_name" />
					</div>
					<div className={FIELD}>
						<label htmlFor={`${formId}-email`}>Email</label>
						<input
							id={`${formId}-email`}
							name="email"
							type="email"
							autoComplete="email"
							required
						/>
						<p className={FIELD_HINT} data-field-error="email" />
					</div>
					<div className={FIELD_FULL}>
						<label htmlFor={`${formId}-site`}>{websiteLabel}</label>
						<input
							id={`${formId}-site`}
							name="website"
							type="url"
							inputMode="url"
							placeholder={websitePlaceholder}
							required={websiteRequired}
						/>
						<p className={FIELD_HINT} data-field-error="website" />
					</div>
					{showPhoneField ? (
						<div className={FIELD}>
							<label htmlFor={`${formId}-phone`}>Phone (optional)</label>
							<input
								id={`${formId}-phone`}
								name="phone"
								type="tel"
								autoComplete="tel"
							/>
							<p className={FIELD_HINT} data-field-error="phone" />
						</div>
					) : null}
					<div className={FIELD_FULL}>
						<label htmlFor={`${formId}-issue`}>{issueLabel}</label>
						<textarea
							id={`${formId}-issue`}
							name="biggest_issue"
							rows={issueRows}
							placeholder={issuePlaceholder}
							required={issueRequired}
						/>
						<p className={FIELD_HINT} data-field-error="biggest_issue" />
					</div>
				</div>

				<p className={META} data-form-error hidden />
				<div className={ACTIONS}>
					{turnstileRequired && (
						<div className="flex flex-col items-center gap-2 py-4">
							<Turnstile
								siteKey={siteKey}
								onSuccess={(token) => setTurnstileToken(token)}
								onExpire={() => setTurnstileToken(null)}
								onError={() => setTurnstileToken(null)}
								options={{ theme: "dark", size: "flexible" }}
							/>
							<p className="text-[0.7rem] font-bold uppercase tracking-widest text-white/30">
								Security check required to proceed
							</p>
						</div>
					)}
					<button
						type="submit"
						className={SUBMIT_BTN}
						data-form-submit
						disabled={isDisabled}
						aria-disabled={isDisabled}
					>
						{submitLabel}
					</button>
				</div>
				<p className={PRIVACY}>{metaMessage}</p>
			</div>

			<div data-form-success hidden>
				<p className={STATUS}>Thanks — we received your message.</p>
				<p className={PRIVACY}>
					Questions?{" "}
					<a href={`mailto:${businessProfile.email}`}>
						{businessProfile.email}
					</a>
				</p>
			</div>
		</form>
	);
}
