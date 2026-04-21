"use client";

import { BRAND_ASSETS } from "@dba/theme/brand";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { brandConfig } from "@/lib/theme.config";

/**
 * Client Portal Login
 *
 * Magic link login — client enters email, gets a login link.
 * Supports per-org branding via ?org=orgId query parameter.
 */

type PortalBranding = {
	brandName: string;
	brandColor: string;
	brandInitial: string;
};

const DEFAULT_BRANDING: PortalBranding = {
	brandName: "Client Portal",
	brandColor: "#2563eb",
	brandInitial: "D",
};

export default function PortalLoginPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [branding, setBranding] = useState<PortalBranding>(DEFAULT_BRANDING);
	const searchParams = useSearchParams();
	const orgId = searchParams.get("org");

	// Load org branding if ?org= param exists
	useEffect(() => {
		if (!orgId) return;

		async function loadBranding() {
			try {
				const res = await fetch(`/api/portal/branding?org=${orgId}`);
				if (res.ok) {
					const data = await res.json();
					setBranding({
						brandName: data.brandName || DEFAULT_BRANDING.brandName,
						brandColor: data.brandColor || DEFAULT_BRANDING.brandColor,
						brandInitial: data.brandInitial || DEFAULT_BRANDING.brandInitial,
					});
				}
			} catch {
				// Fall back to defaults
			}
		}
		loadBranding();
	}, [orgId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/portal/magic-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), orgId }),
			});

			if (res.ok) {
				setSent(true);
			} else {
				const data = await res.json();
				setError(data.error || "Something went wrong");
			}
		} catch {
			setError("Network error. Please try again.");
		}
		setLoading(false);
	};

	if (sent) {
		return (
			<div className="flex items-center justify-center min-h-[60vh] relative">
				<div className="orb w-[350px] h-[350px] bg-[hsl(150_60%_50%/0.06)] top-10 right-10" />

				<div className="glass-card p-8 max-w-md w-full text-center animate-scale-in">
					<div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#10b981"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M22 12h-6l-2 3h-4l-2-3H2" />
							<path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
						</svg>
					</div>
					<h2 className="text-lg font-bold text-white mb-2">
						Check Your Email
					</h2>
					<p className="text-sm text-text-muted mb-4">
						We sent a login link to{" "}
						<strong className="text-white">{email}</strong>. Click the link in
						the email to access your portal.
					</p>
					<p className="text-xs text-text-muted">
						Didn&apos;t receive it?{" "}
						<button
							onClick={() => {
								setSent(false);
								setLoading(false);
							}}
							className="hover:underline"
							style={{ color: branding.brandColor }}
						>
							Try again
						</button>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center min-h-[60vh] relative">
			{/* Decorative orbs */}
			<div className="orb w-[400px] h-[400px] bg-[rgb(59_130_246/0.06)] -top-20 -left-20" />
			<div className="orb w-[300px] h-[300px] bg-[hsl(221_70%_55%/0.05)] -bottom-16 -right-16" />

			<div className="glass-card p-8 max-w-md w-full animate-scale-in relative">
				{/* Top gradient accent — uses brand color */}
				<div
					className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-50"
					style={{
						background: `linear-gradient(to right, transparent, ${branding.brandColor}, transparent)`,
					}}
				/>

				<div className="text-center mb-6">
					{!orgId ? (
						<div className="mx-auto mb-4 flex justify-center">
							<Image
								src={BRAND_ASSETS.mark}
								alt=""
								width={56}
								height={42}
								className="h-14 w-auto object-contain"
								priority
							/>
						</div>
					) : (
						<div
							className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-xl"
							style={{
								background: `linear-gradient(135deg, ${branding.brandColor}, ${branding.brandColor}99)`,
								boxShadow: `0 10px 25px ${branding.brandColor}40`,
							}}
						>
							{branding.brandInitial}
						</div>
					)}
					<h1 className="text-xl font-bold text-white mb-1">
						{branding.brandName}
					</h1>
					<p className="text-sm text-text-muted">
						Enter your email to access your project dashboard
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="portal-email"
							className="text-xs text-text-muted uppercase tracking-wider block mb-1.5"
						>
							Email Address
						</label>
						<input
							id="portal-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@company.com"
							required
							className="w-full bg-surface-1 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
							style={{ borderColor: email ? branding.brandColor : undefined }}
						/>
					</div>

					{error && (
						<p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading || !email.trim()}
						className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-50 hover:-translate-y-0.5"
						style={{
							background: branding.brandColor,
							boxShadow: `0 4px 20px ${branding.brandColor}30`,
						}}
					>
						{loading ? "Sending..." : "Send Login Link"}
					</button>
				</form>

				<p className="text-xs text-text-muted text-center mt-6">
					No account? Contact{" "}
					<a
						href={`mailto:${brandConfig.supportEmail}`}
						className="hover:underline"
						style={{ color: branding.brandColor }}
					>
						{brandConfig.supportEmail}
					</a>
				</p>
			</div>
		</div>
	);
}
