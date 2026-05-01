"use client";

import { useId, useRef } from "react";
import { btnPrimary } from "@/design-system/buttons";
import {
	descriptionAlreadyHasRegionPrefix,
	regionTagFromPhone,
} from "@/lib/leadRegion";

/* ── Phase 5: salesforce-* CSS classes migrated to inline Tailwind ── */
const SF_FORM = "block";
const SF_GRID =
	"grid grid-cols-2 max-[600px]:grid-cols-1 gap-x-5 gap-y-4 max-[600px]:gap-3 mb-4";
const SF_FIELD =
	"flex flex-col gap-[0.4rem] [&>label]:text-[0.8rem] [&>label]:font-semibold [&>label]:text-[var(--text-cream)] [&>label]:uppercase [&>label]:tracking-[0.08em] [&_input]:w-full [&_textarea]:w-full [&_select]:w-full [&_input]:min-w-0 [&_textarea]:min-w-0 [&_select]:min-w-0 [&_input]:px-[0.95rem] [&_textarea]:px-[0.95rem] [&_select]:px-[0.95rem] [&_input]:py-[0.7rem] [&_textarea]:py-[0.7rem] [&_select]:py-[0.7rem] [&_input]:rounded-[0.65rem] [&_textarea]:rounded-[0.65rem] [&_select]:rounded-[0.65rem] [&_input]:border [&_textarea]:border [&_select]:border [&_input]:border-[rgb(var(--accent-bronze-rgb)/0.32)] [&_textarea]:border-[rgb(var(--accent-bronze-rgb)/0.32)] [&_select]:border-[rgb(var(--accent-bronze-rgb)/0.32)] [&_input]:bg-[rgba(8,12,18,0.78)] [&_textarea]:bg-[rgba(8,12,18,0.78)] [&_select]:bg-[rgba(8,12,18,0.78)] [&_input]:text-white [&_textarea]:text-white [&_select]:text-white [&_input]:[caret-color:rgb(var(--accent-bronze-rgb)/0.95)] [&_input]:text-[0.95rem] [&_textarea]:text-[0.95rem] [&_select]:text-[0.95rem] [&_input]:font-[inherit] [&_textarea]:font-[inherit] [&_input]:transition-[border-color,box-shadow,background-color] [&_textarea]:transition-[border-color,box-shadow,background-color] [&_input]:duration-200 [&_textarea]:duration-200 [&_input:focus]:outline-none [&_textarea:focus]:outline-none [&_select:focus]:outline-none [&_input:focus]:border-[rgb(var(--accent-bronze-rgb)/0.7)] [&_textarea:focus]:border-[rgb(var(--accent-bronze-rgb)/0.7)] [&_input:focus]:bg-[rgba(10,14,22,0.92)] [&_textarea:focus]:bg-[rgba(10,14,22,0.92)] [&_input:focus]:shadow-[0_0_0_3px_rgb(var(--accent-bronze-rgb)/0.18)] [&_textarea:focus]:shadow-[0_0_0_3px_rgb(var(--accent-bronze-rgb)/0.18)] [&_input::placeholder]:text-white/[0.42] [&_textarea::placeholder]:text-white/[0.42]";
const SF_FIELD_FULL = "col-span-full";
const SF_ACTIONS =
	"flex justify-start max-[600px]:justify-center mt-4 [&>button]:max-[600px]:w-full [&>button]:max-[600px]:min-h-11";
const SF_PRIVACY = "mt-3 text-[0.75rem] text-[var(--text-muted)]";

/**
 * Salesforce Web-to-Lead contact form. Submits directly to Salesforce.
 * No client-side captcha: the previous reCAPTCHA v2 widget required
 * Salesforce-side validation that was silently dropping leads.
 */
export function SalesforceContactForm() {
	const formId = useId();
	const phoneRef = useRef<HTMLInputElement>(null);
	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	const injectRegionPrefix = () => {
		const phone = phoneRef.current?.value ?? "";
		const region = regionTagFromPhone(phone);
		if (!region || !descriptionRef.current) return;
		const tag = `Region: ${region}. `;
		const cur = descriptionRef.current.value;
		if (descriptionAlreadyHasRegionPrefix(cur)) return;
		descriptionRef.current.value = tag + cur;
	};

	return (
		<form
			action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Dao00001YO4nx"
			method="POST"
			className={SF_FORM}
			onSubmit={injectRegionPrefix}
		>
			<input type="hidden" name="oid" value="00Dao00001YO4nx" />
			<input
				type="hidden"
				name="retURL"
				value="https://designedbyanthony.com/thank-you"
			/>

			<div className={SF_GRID}>
				<div className={SF_FIELD}>
					<label htmlFor={`${formId}-first_name`}>First Name</label>
					<input
						id={`${formId}-first_name`}
						maxLength={40}
						name="first_name"
						type="text"
						autoComplete="given-name"
						required
					/>
				</div>

				<div className={SF_FIELD}>
					<label htmlFor={`${formId}-email`}>Email</label>
					<input
						id={`${formId}-email`}
						maxLength={80}
						name="email"
						type="email"
						autoComplete="email"
						required
					/>
				</div>

				<div className={SF_FIELD}>
					<label htmlFor={`${formId}-phone`}>Phone</label>
					<input
						id={`${formId}-phone`}
						ref={phoneRef}
						maxLength={40}
						name="phone"
						type="tel"
						autoComplete="tel"
					/>
				</div>

				<div className={SF_FIELD}>
					<label htmlFor={`${formId}-url`}>Website</label>
					<input
						id={`${formId}-url`}
						maxLength={80}
						name="url"
						type="url"
						inputMode="url"
						autoComplete="url"
						placeholder="https://example.com"
					/>
				</div>

				<div className={`${SF_FIELD} ${SF_FIELD_FULL}`}>
					<label htmlFor={`${formId}-description`}>Message</label>
					<textarea
						id={`${formId}-description`}
						ref={descriptionRef}
						name="description"
						rows={4}
						placeholder="Tell us what you're looking for..."
						required
					/>
				</div>
			</div>

			<div className={SF_ACTIONS}>
				<button type="submit" className={btnPrimary}>
					Let&apos;s build something great.
				</button>
			</div>

			<p className={SF_PRIVACY}>We reply within one business day.</p>
		</form>
	);
}
