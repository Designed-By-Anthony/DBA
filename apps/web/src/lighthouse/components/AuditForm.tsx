"use client";

import type { AuditData } from "@lh/auditReport";
import { initCursorGlow } from "@lh/lib/cursorGlow";
import type React from "react";
import { useEffect, useState } from "react";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { AuditResults } from "./AuditResults";
import { AuditScanProgress, type ScanPhase } from "./AuditScanProgress";

const LOADING_MESSAGES = [
	"Calling Google PageSpeed Insights for mobile lab scores…",
	"Reading your homepage HTML for titles, headings, and schema…",
	"Checking robots.txt, sitemap, and redirect behavior…",
	"Pulling optional local/maps context when configured…",
	"Running the AI pass for your executive summary and top fixes…",
];

export function AuditForm() {
	const [url, setUrl] = useState("");
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [company, setCompany] = useState("");
	const [location, setLocation] = useState("");

	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [errorMsg, setErrorMsg] = useState("");
	const [results, setResults] = useState<AuditData | null>(null);
	const [reportId, setReportId] = useState<string | null>(null);

	const [loadingTextIndex, setLoadingTextIndex] = useState(0);
	const [scanPhase, setScanPhase] = useState<ScanPhase>("pagespeed");

	useEffect(() => {
		if (status !== "loading") {
			const cleanup = initCursorGlow(".glass-card");
			return cleanup;
		}
	}, [status]);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		let phaseTimer: ReturnType<typeof setInterval> | undefined;
		if (status === "loading") {
			setScanPhase("pagespeed");
			const start = Date.now();
			interval = setInterval(() => {
				setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
			}, 3800);
			phaseTimer = setInterval(() => {
				const elapsed = Date.now() - start;
				if (elapsed < 12_000) setScanPhase("pagespeed");
				else if (elapsed < 28_000) setScanPhase("onpage");
				else if (elapsed < 48_000) setScanPhase("crawl");
				else if (elapsed < 72_000) setScanPhase("local");
				else setScanPhase("ai");
			}, 600);
		}
		return () => {
			if (interval) clearInterval(interval);
			if (phaseTimer) clearInterval(phaseTimer);
		};
	}, [status]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!url || status === "loading") return;

		let finalUrl = url;
		if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
			finalUrl = `https://${finalUrl}`;
		}

		setStatus("loading");
		setLoadingTextIndex(0);
		setErrorMsg("");

		try {
			const res = await fetch(buildPublicApiUrl("/api/audit"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					url: finalUrl,
					email,
					name,
					company,
					location,
				}),
			});

			let data: {
				error?: string;
				results?: AuditData | null;
				reportId?: string;
				psiDegradedReason?: string | null;
			} | null = null;
			try {
				data = await res.json();
			} catch {
				data = null;
			}

			if (!res.ok) {
				throw new Error(data?.error || "Something went wrong.");
			}

			if (!data?.results) {
				throw new Error("We couldn't complete the audit. Please try again.");
			}

			setResults(data.results);
			setReportId(typeof data.reportId === "string" ? data.reportId : null);
			setStatus("success");
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Failed to fetch audit.";
			setErrorMsg(message);
			setStatus("error");
		}
	};

	if (status === "success" && results) {
		return (
			<AuditResults
				data={results}
				reportId={reportId}
				contactEmail={email}
				contactName={name}
				onReset={() => {
					setStatus("idle");
					setResults(null);
					setReportId(null);
				}}
			/>
		);
	}

	return (
		<div className="lh-audit-form-wrap" id="run-audit">
			{status === "loading" ? (
				<div className="lh-loading-overlay">
					<AuditScanProgress
						activePhase={scanPhase}
						message={LOADING_MESSAGES[loadingTextIndex]}
					/>
				</div>
			) : null}

			<form onSubmit={handleSubmit} className="lh-form-grid">
				<div className="lh-form-header">
					<p className="lighthouse-result-eyebrow">
						Free · Private · No Account Needed
					</p>
					<h2>Get Your Free Report</h2>
					<p>
						Enter your site below. We score it on speed, SEO, and trust signals
						in about 60 seconds and send a private report link to your email.
					</p>
				</div>

				<div className="lh-url-block">
					<label htmlFor="url">Website to scan</label>
					<input
						id="url"
						name="url"
						type="text"
						inputMode="url"
						required
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://yoursite.com"
						autoComplete="url"
						autoCorrect="off"
						autoCapitalize="off"
						spellCheck={false}
						className="lh-field lh-url-input"
					/>
				</div>

				<fieldset className="lh-fieldset">
					<legend className="lh-legend">Where to send the report</legend>
					<div className="lh-field-grid">
						<div>
							<label htmlFor="name">Your name</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Jane Smith"
								autoComplete="name"
								className="lh-field"
							/>
						</div>
						<div>
							<label htmlFor="company">Company</label>
							<input
								id="company"
								name="company"
								type="text"
								required
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder="Your business name"
								autoComplete="organization"
								className="lh-field"
							/>
						</div>
						<div>
							<label htmlFor="email">Email for your report</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@company.com"
								autoComplete="email"
								className="lh-field"
							/>
						</div>
						<div>
							<label htmlFor="location">City &amp; state</label>
							<input
								id="location"
								name="location"
								type="text"
								required
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="e.g. Syracuse, NY"
								autoComplete="address-level2"
								className="lh-field"
							/>
						</div>
					</div>
				</fieldset>

				{status === "error" && (
					<div className="lh-error" role="alert" aria-live="polite">
						{errorMsg}
					</div>
				)}

				<div className="lh-submit-row">
					<button
						type="submit"
						disabled={status === "loading"}
						aria-disabled={status === "loading"}
						className="lh-submit-btn"
					>
						<span>
							{status === "loading" ? "Running audit…" : "Run free audit"}
							{status !== "loading" && <span aria-hidden="true">→</span>}
						</span>
					</button>

					<div className="lh-submit-meta">
						<p>~60-90s · Private report · Shareable URL</p>
					</div>
				</div>
			</form>
		</div>
	);
}
