import { getTurnstileSiteKey } from "@/lib/turnstile";

const LEAD_SOURCE_LABELS: Record<string, string> = {
	home_page_contact: "Home page contact",
	contact_page: "Contact page",
	facebook_growth_offer: "Facebook growth offer",
	free_website_audit: "Free website audit",
	general_inquiry: "Contact page",
	quick_contact_home: "Home page contact",
};

function leadSourceLabelForOfferType(ot: string): string {
	return (
		LEAD_SOURCE_LABELS[ot] ??
		ot.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
	);
}

const defaultFormEndpoint =
	process.env.NEXT_PUBLIC_INGEST_URL ||
	process.env.NEXT_PUBLIC_CRM_LEAD_URL ||
	"/api/lead-email";

const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "";

export interface AuditFormProps {
	ctaSource: string;
	pageContext: string;
	sourcePath: string;
	pageTitle?: string;
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

export function AuditForm({
	ctaSource,
	pageContext,
	sourcePath,
	pageTitle = "Designed by Anthony",
	formEndpoint = defaultFormEndpoint,
	offerType = "free_website_audit",
	subjectLine = `Free Website Audit Request - ${pageTitle}`,
	successLinkHref = "/portfolio",
	successLinkLabel = "See Example Builds",
	successMode = "inline",
	successRedirect = "/thank-you?offer=audit",
	successTag = "Audit Requested",
	successTitle = "Audit request received",
	successMessage =
		"Anthony will review your submission and reach out within 24 hours with the clearest next step.",
	successPoints = [
		"I run the BuiltWith stack scan and Lighthouse test.",
		"I compile the clearest issues and likely gains into one report.",
		"You will hear from Anthony within 24 hours with a practical next step.",
	],
	submitLabel = "Send My Audit Request",
	metaMessage =
		"No spam. Just a BuiltWith scan, a Lighthouse test, and a direct follow-up within 24 hours.",
	websiteLabel = "Website URL",
	websitePlaceholder = "yourwebsite.com",
	websiteRequired = true,
	issueLabel = "What feels off right now?",
	issuePlaceholder =
		"Low-quality leads, not enough calls, weak local rankings, dated design, slow mobile experience...",
	issueRequired = true,
	showPhoneField = true,
	issueRows = 5,
}: AuditFormProps) {
	const turnstileSiteKey = getTurnstileSiteKey();
	const leadSourceLabel = leadSourceLabelForOfferType(offerType);

	return (
		<form
			className="audit-form"
			action={formEndpoint}
			method="POST"
			data-audit-form
			data-success-mode={successMode}
			data-success-redirect={successRedirect}
			data-tenant-id={tenantId}
		>
			<input type="hidden" name="_subject" value={subjectLine} />
			<input type="hidden" name="source_page" value={sourcePath} />
			<input type="hidden" name="page_url" value="" />
			<input type="hidden" name="referrer_url" value="" />
			<input type="hidden" name="page_title" value={pageTitle} />
			<input type="hidden" name="ga_client_id" value="" />
			<input type="hidden" name="cta_source" value={ctaSource} />
			<input type="hidden" name="offer_type" value={offerType} />
			<input type="hidden" name="lead_source" value={leadSourceLabel} />
			<input type="hidden" name="page_context" value={pageContext} />
			<input
				type="text"
				name="_hp"
				autoComplete="off"
				tabIndex={-1}
				aria-hidden="true"
				className="audit-form-honeypot"
			/>

			<div className="audit-form-grid" data-form-shell>
				<div className="audit-form-field">
					<label htmlFor={`${ctaSource}-first-name`}>First name</label>
					<input
						id={`${ctaSource}-first-name`}
						name="first_name"
						type="text"
						autoComplete="given-name"
						required
					/>
					<span className="audit-field-error" data-field-error="first_name" />
				</div>

				<div className="audit-form-field">
					<label htmlFor={`${ctaSource}-email`}>Email</label>
					<input
						id={`${ctaSource}-email`}
						name="email"
						type="email"
						autoComplete="email"
						required
					/>
					<span className="audit-field-error" data-field-error="email" />
				</div>

				<div className="audit-form-field audit-form-field-full">
					<label htmlFor={`${ctaSource}-website`}>
						<span>{websiteLabel}</span>
						{!websiteRequired && (
							<span className="audit-label-optional">Optional</span>
						)}
					</label>
					<input
						id={`${ctaSource}-website`}
						name="website"
						type="text"
						inputMode="url"
						placeholder={websitePlaceholder}
						autoComplete="url"
						required={websiteRequired}
					/>
					<span className="audit-field-error" data-field-error="website" />
				</div>

				<div className="audit-form-field audit-form-field-full">
					<label htmlFor={`${ctaSource}-biggest-issue`}>
						<span>{issueLabel}</span>
						{!issueRequired && (
							<span className="audit-label-optional">Optional</span>
						)}
					</label>
					<textarea
						id={`${ctaSource}-biggest-issue`}
						name="biggest_issue"
						rows={issueRows}
						placeholder={issuePlaceholder}
						required={issueRequired}
					/>
					<span className="audit-field-error" data-field-error="biggest_issue" />
				</div>

				{showPhoneField && (
					<div className="audit-form-field audit-form-field-full">
						<label htmlFor={`${ctaSource}-phone`}>
							<span>Phone</span>
							<span className="audit-label-optional">Optional</span>
						</label>
						<input
							id={`${ctaSource}-phone`}
							name="phone"
							type="tel"
							autoComplete="tel"
						/>
						<span className="audit-field-error" data-field-error="phone" />
					</div>
				)}
			</div>

			<div
				className="cf-turnstile"
				data-sitekey={turnstileSiteKey}
				data-theme="dark"
				data-size="invisible"
				data-appearance="interaction-only"
				data-callback="__dbaAuditFormTurnstileSuccess"
				data-error-callback="__dbaAuditFormTurnstileFailure"
			/>

			<p className="audit-form-status" data-form-error hidden />

			<div className="audit-form-actions" data-form-actions>
				<button type="submit" className="btn btn-primary audit-submit" data-form-submit>
					{submitLabel}
				</button>
				<p className="audit-form-meta">{metaMessage}</p>
				<p className="audit-form-privacy">
					Protected by Turnstile. By submitting, you agree to the{" "}
					<a href="/privacy">Privacy Policy</a> and <a href="/cookie">Cookie Policy</a>.
				</p>
			</div>

			<div className="audit-success-panel" data-form-success hidden>
				<div className="card-tag">{successTag}</div>
				<h3>{successTitle}</h3>
				<p>{successMessage}</p>
				<ul className="trust-list audit-success-list">
					{successPoints.map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
				<div className="audit-success-actions">
					<a href={successLinkHref} className="btn btn-outline">
						{successLinkLabel}
					</a>
				</div>
			</div>
		</form>
	);
}
