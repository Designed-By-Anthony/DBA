"use client";

import { useId } from "react";
import { businessProfile } from "@/lib/seo";

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

/**
 * Native marketing lead form — wired by `src/scripts/audit-forms.ts`
 * (reCAPTCHA Enterprise + JSON POST). Submits to `action`
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
	const action = formEndpoint?.trim() || "/api/lead-email";

	return (
		<form
			className="audit-form"
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
			<div data-form-shell>
				<div className="audit-form-grid">
					<div className="audit-form-field">
						<label htmlFor={`${formId}-first`}>First name</label>
						<input
							id={`${formId}-first`}
							name="first_name"
							type="text"
							autoComplete="given-name"
							required
						/>
						<p
							className="audit-form-field-hint"
							data-field-error="first_name"
						/>
					</div>
					<div className="audit-form-field">
						<label htmlFor={`${formId}-email`}>Email</label>
						<input
							id={`${formId}-email`}
							name="email"
							type="email"
							autoComplete="email"
							required
						/>
						<p className="audit-form-field-hint" data-field-error="email" />
					</div>
					<div className="audit-form-field audit-form-field-full">
						<label htmlFor={`${formId}-site`}>{websiteLabel}</label>
						<input
							id={`${formId}-site`}
							name="website"
							type="url"
							inputMode="url"
							placeholder={websitePlaceholder}
							required={websiteRequired}
						/>
						<p className="audit-form-field-hint" data-field-error="website" />
					</div>
					{showPhoneField ? (
						<div className="audit-form-field">
							<label htmlFor={`${formId}-phone`}>Phone (optional)</label>
							<input
								id={`${formId}-phone`}
								name="phone"
								type="tel"
								autoComplete="tel"
							/>
							<p className="audit-form-field-hint" data-field-error="phone" />
						</div>
					) : null}
					<div className="audit-form-field audit-form-field-full">
						<label htmlFor={`${formId}-issue`}>{issueLabel}</label>
						<textarea
							id={`${formId}-issue`}
							name="biggest_issue"
							rows={issueRows}
							placeholder={issuePlaceholder}
							required={issueRequired}
						/>
						<p
							className="audit-form-field-hint"
							data-field-error="biggest_issue"
						/>
					</div>
				</div>

				<input type="hidden" name="g-recaptcha-response" value="" />

				<p className="audit-form-meta" data-form-error hidden />
				<div className="audit-form-actions">
					<button
						type="submit"
						className="btn btn-primary-audit"
						data-form-submit
					>
						{submitLabel}
					</button>
				</div>
				<p className="audit-form-privacy">{metaMessage}</p>
			</div>

			<div data-form-success hidden>
				<p className="audit-form-status">Thanks — we received your message.</p>
				<p className="audit-form-privacy">
					Questions?{" "}
					<a href={`mailto:${businessProfile.email}`}>
						{businessProfile.email}
					</a>
				</p>
			</div>
		</form>
	);
}
