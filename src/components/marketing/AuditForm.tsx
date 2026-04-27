"use client";

import { useEffect, useId, useRef, useState } from "react";
import { businessProfile } from "@/lib/seo";

const FRESHWORKS_FORM_SCRIPT =
	"https://designedbyanthony.myfreshworks.com/crm/sales/web_forms/ff38685269fceeb3790739cecf2e781d6393cac8caa7a893bb8d46c76fb8137f/form.js";

const SCRIPT_ATTR = "data-dba-freshworks-form";
const LOAD_TIMEOUT_MS = 18000;

export interface AuditFormProps {
	ctaSource?: string;
	pageContext?: string;
	sourcePath?: string;
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

export function AuditForm(_props: AuditFormProps) {
	const statusId = useId();
	const mountRef = useRef<HTMLDivElement>(null);
	const [embedState, setEmbedState] = useState<"loading" | "ready" | "error">(
		"loading",
	);

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;

		const existing = document.querySelector<HTMLScriptElement>(
			`script[${SCRIPT_ATTR}]`,
		);
		if (existing) {
			existing.remove();
		}

		const script = document.createElement("script");
		script.src = FRESHWORKS_FORM_SCRIPT;
		script.async = true;
		script.crossOrigin = "anonymous";
		script.setAttribute(SCRIPT_ATTR, "1");

		const onLoad = () => setEmbedState("ready");
		const onError = () => setEmbedState("error");
		script.addEventListener("load", onLoad);
		script.addEventListener("error", onError);

		mount.appendChild(script);

		const timeout = window.setTimeout(() => {
			setEmbedState((prev) => (prev === "loading" ? "error" : prev));
		}, LOAD_TIMEOUT_MS);

		return () => {
			window.clearTimeout(timeout);
			script.removeEventListener("load", onLoad);
			script.removeEventListener("error", onError);
			script.remove();
		};
	}, []);

	return (
		<div className="dba-embed-form">
			<p id={statusId} className="sr-only" aria-live="polite">
				{embedState === "loading"
					? "Loading contact form."
					: embedState === "ready"
						? "Contact form loaded."
						: "Contact form could not load in this browser."}
			</p>
			{embedState === "loading" ? (
				<div className="dba-embed-form__loading" aria-hidden="true">
					<div className="dba-embed-form__loading-dots" aria-hidden="true">
						<span className="dba-embed-form__loading-dot" />
						<span className="dba-embed-form__loading-dot" />
						<span className="dba-embed-form__loading-dot" />
					</div>
					<span className="dba-embed-form__loading-label">
						Loading secure form…
					</span>
				</div>
			) : null}
			{embedState === "error" ? (
				<div className="dba-embed-form__fallback surface-card surface-card--technical">
					<p className="dba-embed-form__fallback-title">
						Form did not load (network, blocker, or strict privacy mode).
					</p>
					<p className="dba-embed-form__fallback-copy">
						Email us directly or book a short call — same inbox either way.
					</p>
					<div className="marketing-cta-row">
						<a
							className="btn btn-primary-audit"
							href={`mailto:${businessProfile.email}?subject=${encodeURIComponent("Website inquiry — Designed by Anthony")}`}
						>
							Email {businessProfile.email}
						</a>
					</div>
				</div>
			) : null}
			<div
				ref={mountRef}
				id="freshworks-contact-form"
				className={
					embedState === "error"
						? "dba-embed-form__mount"
						: "dba-embed-form__mount dba-embed-form__mount--visible"
				}
				aria-busy={embedState === "loading"}
			/>
		</div>
	);
}
