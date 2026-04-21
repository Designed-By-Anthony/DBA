"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { type AuditData, AuditResults } from "./AuditResults";

const LOADING_MESSAGES = [
	"Running Google Pagespeed Scan...",
	"Analyzing Core Web Vitals...",
	"Checking for Render-Blocking Resources...",
	"Testing Mobile Accessibility...",
	"Compiling Final Diagnostic...",
];

type TurnstileApi = {
	render: (
		container: string | HTMLElement,
		options: Record<string, unknown>,
	) => string | undefined;
	execute: (widgetId: string | HTMLElement) => void;
	reset: (widgetId: string | HTMLElement) => void;
	remove?: (widgetId: string | HTMLElement) => void;
};

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
	const turnstileTokenRef = useRef<string>("");

	useEffect(() => {
		if (typeof window === "undefined") return;
		const anyWindow = window as Window & {
			turnstile?: {
				render: (
					container: string | HTMLElement,
					options: Record<string, unknown>,
				) => string;
			};
			__lighthouseTurnstileOnSuccess?: (token: string) => void;
			__lighthouseTurnstileOnExpired?: () => void;
			__lighthouseTurnstileOnError?: () => void;
		};

		anyWindow.__lighthouseTurnstileOnSuccess = (token: string) => {
			turnstileTokenRef.current = token;
		};
		anyWindow.__lighthouseTurnstileOnExpired = () => {
			turnstileTokenRef.current = "";
		};
		anyWindow.__lighthouseTurnstileOnError = () => {
			turnstileTokenRef.current = "";
		};

		const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
		if (!siteKey) return;

		const mount = () => {
			const host = document.getElementById("lighthouse-turnstile");
			if (!host || !anyWindow.turnstile || host.childElementCount > 0) return;
			anyWindow.turnstile.render(host, {
				sitekey: siteKey,
				theme: "dark",
				callback: "__lighthouseTurnstileOnSuccess",
				"expired-callback": "__lighthouseTurnstileOnExpired",
				"error-callback": "__lighthouseTurnstileOnError",
			});
		};

		mount();
		const interval = window.setInterval(mount, 250);
		return () => {
			window.clearInterval(interval);
			anyWindow.__lighthouseTurnstileOnSuccess = undefined;
			anyWindow.__lighthouseTurnstileOnExpired = undefined;
			anyWindow.__lighthouseTurnstileOnError = undefined;
		};
	}, []);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (status === "loading") {
			interval = setInterval(() => {
				setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
			}, 3500);
		}
		return () => clearInterval(interval);
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
			const turnstileToken = turnstileTokenRef.current;
			if (!turnstileToken) {
				setErrorMsg("Please complete the security check.");
				setStatus("error");
				return;
			}

			const res = await fetch("/api/audit", {
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
					turnstileToken,
				}),
			});

			let data: {
				error?: string;
				results?: AuditData | null;
				reportId?: string;
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
				onReset={() => {
					setStatus("idle");
					setResults(null);
					setReportId(null);
				}}
			/>
		);
	}

	return (
		<div className="w-full relative">
			{status === "loading" && (
				<div className="absolute inset-0 bg-[rgba(11,18,32,0.97)] backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 text-center rounded-2xl">
					<div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin-slow mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
					<p className="text-xl font-display font-medium text-glow mb-3 transition-opacity duration-500">
						{LOADING_MESSAGES[loadingTextIndex]}
					</p>
					<p className="text-sm text-[rgba(255,255,255,0.62)]">
						This deep scan can take up to a minute. Hold tight.
					</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-5">
				<div>
					<label
						htmlFor="url"
						className="block text-sm font-semibold text-label mb-1.5 tracking-wide"
					>
						Website URL
					</label>
					<input
						id="url"
						name="url"
						type="text"
						required
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="e.g. designedbyanthony.com"
						className="w-full bg-input border border-input-border rounded-xl px-4 py-3.5 text-white placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[rgba(96,165,250,0.4)] transition-all"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-semibold text-label mb-1.5 tracking-wide"
						>
							Your Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Anthony"
							className="w-full bg-input border border-input-border rounded-xl px-4 py-3.5 text-white placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[rgba(96,165,250,0.4)] transition-all"
						/>
					</div>
					<div>
						<label
							htmlFor="company"
							className="block text-sm font-semibold text-label mb-1.5 tracking-wide"
						>
							Company
						</label>
						<input
							id="company"
							name="company"
							type="text"
							required
							value={company}
							onChange={(e) => setCompany(e.target.value)}
							placeholder="Designed by A..."
							className="w-full bg-input border border-input-border rounded-xl px-4 py-3.5 text-white placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[rgba(96,165,250,0.4)] transition-all"
						/>
					</div>
				</div>

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-semibold text-label mb-1.5 tracking-wide"
					>
						Where should we send the report?
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="anthony@designedbyanthony.com"
						className="w-full bg-input border border-input-border rounded-xl px-4 py-3.5 text-white placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[rgba(96,165,250,0.4)] transition-all"
					/>
				</div>
				<div>
					<label
						htmlFor="location"
						className="block text-sm font-semibold text-label mb-1.5 tracking-wide"
					>
						City & State
					</label>
					<input
						id="location"
						name="location"
						type="text"
						required
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						placeholder="e.g. Syracuse, NY"
						className="w-full bg-input border border-input-border rounded-xl px-4 py-3.5 text-white placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[rgba(96,165,250,0.4)] transition-all"
					/>
				</div>

				{status === "error" && (
					<div
						className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm"
						aria-live="polite"
					>
						{errorMsg}
					</div>
				)}

				{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
					<div id="lighthouse-turnstile" className="min-h-[65px]" />
				) : null}

				<button
					type="submit"
					disabled={status === "loading"}
					aria-disabled={status === "loading"}
					className="w-full text-white font-bold text-lg rounded-xl px-4 py-4 mt-4 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
					style={{
						background:
							"linear-gradient(135deg, rgba(96, 165, 250, 0.34), rgba(37, 99, 235, 1))",
						border: "1px solid rgba(96, 165, 250, 0.55)",
						boxShadow:
							"0 22px 40px -22px rgba(37, 99, 235, 1), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
					}}
				>
					Run Free Audit
				</button>
			</form>
		</div>
	);
}
