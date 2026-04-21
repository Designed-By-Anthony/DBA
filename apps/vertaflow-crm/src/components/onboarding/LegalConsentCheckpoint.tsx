"use client";

import { ExternalLink, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	acceptLegalAgreements,
	completeOnboardingStep,
} from "@/app/admin/legal/actions";

export default function LegalConsentCheckpoint({
	onAccepted,
}: {
	onAccepted?: () => void;
}) {
	const [tosChecked, setTosChecked] = useState(false);
	const [privacyChecked, setPrivacyChecked] = useState(false);
	const [aupChecked, setAupChecked] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const allChecked = tosChecked && privacyChecked && aupChecked;

	const handleAccept = async () => {
		if (!allChecked) return;
		setLoading(true);
		setError(null);

		try {
			await acceptLegalAgreements();
			await completeOnboardingStep("legal_accepted");
			onAccepted?.();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to save. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-lg mx-auto">
			<div className="flex items-center gap-3 mb-6">
				<div className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/20 flex items-center justify-center">
					<Shield size={20} className="text-[var(--color-brand)]" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-white">Legal Agreements</h2>
					<p className="text-sm text-[var(--color-text-muted)]">
						Please review and accept before continuing
					</p>
				</div>
			</div>

			<div className="space-y-4 mb-6">
				<label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-glass-border)] hover:border-[var(--color-brand)] transition-colors cursor-pointer bg-[var(--color-surface-1)]">
					<input
						type="checkbox"
						checked={tosChecked}
						onChange={(e) => setTosChecked(e.target.checked)}
						className="mt-1 w-4 h-4 accent-[var(--color-brand)]"
					/>
					<div className="flex-1">
						<span className="text-sm text-white font-medium">
							Terms of Service
						</span>
						<p className="text-xs text-[var(--color-text-muted)] mt-0.5">
							I have read and agree to the Terms of Service
						</p>
					</div>
					<Link
						href="/admin/legal/terms"
						target="_blank"
						className="text-[var(--color-brand)] hover:text-white transition-colors"
						onClick={(e) => e.stopPropagation()}
					>
						<ExternalLink size={16} />
					</Link>
				</label>

				<label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-glass-border)] hover:border-[var(--color-brand)] transition-colors cursor-pointer bg-[var(--color-surface-1)]">
					<input
						type="checkbox"
						checked={privacyChecked}
						onChange={(e) => setPrivacyChecked(e.target.checked)}
						className="mt-1 w-4 h-4 accent-[var(--color-brand)]"
					/>
					<div className="flex-1">
						<span className="text-sm text-white font-medium">
							Privacy Policy
						</span>
						<p className="text-xs text-[var(--color-text-muted)] mt-0.5">
							I have read and agree to the Privacy Policy
						</p>
					</div>
					<Link
						href="/admin/legal/privacy"
						target="_blank"
						className="text-[var(--color-brand)] hover:text-white transition-colors"
						onClick={(e) => e.stopPropagation()}
					>
						<ExternalLink size={16} />
					</Link>
				</label>

				<label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-glass-border)] hover:border-[var(--color-brand)] transition-colors cursor-pointer bg-[var(--color-surface-1)]">
					<input
						type="checkbox"
						checked={aupChecked}
						onChange={(e) => setAupChecked(e.target.checked)}
						className="mt-1 w-4 h-4 accent-[var(--color-brand)]"
					/>
					<div className="flex-1">
						<span className="text-sm text-white font-medium">
							Acceptable Use Policy
						</span>
						<p className="text-xs text-[var(--color-text-muted)] mt-0.5">
							I agree to comply with the Acceptable Use Policy
						</p>
					</div>
					<Link
						href="/admin/legal/aup"
						target="_blank"
						className="text-[var(--color-brand)] hover:text-white transition-colors"
						onClick={(e) => e.stopPropagation()}
					>
						<ExternalLink size={16} />
					</Link>
				</label>
			</div>

			{error && <p className="text-sm text-red-400 mb-4">{error}</p>}

			<button
				onClick={handleAccept}
				disabled={!allChecked || loading}
				className="w-full py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{loading ? (
					<>
						<Loader2 size={16} className="animate-spin" />
						Saving...
					</>
				) : (
					"Accept & Continue"
				)}
			</button>

			<p className="text-xs text-center text-[var(--color-text-muted)] mt-4">
				By continuing, you consent to the processing of your data as described
				in our Privacy Policy.
			</p>
		</div>
	);
}
