"use client";

import { useId } from "react";

/**
 * Salesforce Web-to-Lead contact form
 * Submits directly to Salesforce with reCAPTCHA v2
 * Note: reCAPTCHA script is loaded globally in layout.tsx
 */
export function SalesforceContactForm() {
	const formId = useId();

	return (
		<form
				action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Dao00001YO4nx"
				method="POST"
				className="salesforce-contact-form"
			>
				<input
					type="hidden"
					name="captcha_settings"
					value='{"keyname":"DBA","fallback":"true","orgId":"00Dao00001YO4nx","ts":""}'
				/>
				<input type="hidden" name="oid" value="00Dao00001YO4nx" />
				<input
					type="hidden"
					name="retURL"
					value="https://designedbyanthony.com/thank-you"
				/>

				<div className="salesforce-form-grid">
					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-first_name`}>First Name</label>
						<input
							id={`${formId}-first_name`}
							maxLength={40}
							name="first_name"
							size={20}
							type="text"
							autoComplete="given-name"
							required
						/>
					</div>

					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-email`}>Email</label>
						<input
							id={`${formId}-email`}
							maxLength={80}
							name="email"
							size={20}
							type="email"
							autoComplete="email"
							required
						/>
					</div>

					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-phone`}>Phone</label>
						<input
							id={`${formId}-phone`}
							maxLength={40}
							name="phone"
							size={20}
							type="tel"
							autoComplete="tel"
						/>
					</div>

					<div className="salesforce-form-field">
						<label htmlFor={`${formId}-url`}>Website</label>
						<input
							id={`${formId}-url`}
							maxLength={80}
							name="url"
							size={20}
							type="url"
							inputMode="url"
							autoComplete="url"
							placeholder="https://example.com"
						/>
					</div>

					<div className="salesforce-form-field salesforce-form-field-full">
						<label htmlFor={`${formId}-description`}>Message</label>
						<textarea
							id={`${formId}-description`}
							name="description"
							rows={4}
							placeholder="Tell us what you're looking for..."
							required
						/>
					</div>
				</div>

				<div
					className="g-recaptcha"
					data-sitekey="6LfnB9EsAAAAAPhbLN_enDV4s07F00YiLYANq3-Y"
				/>

				<div className="salesforce-form-actions">
					<button type="submit" className="btn btn-primary-audit">
						Send Message
					</button>
				</div>

				<p className="salesforce-form-privacy">
					Protected by reCAPTCHA. We reply within one business day.
				</p>
			</form>
		);
}
