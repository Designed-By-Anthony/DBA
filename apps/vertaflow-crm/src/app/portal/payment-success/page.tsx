import Link from "next/link";

export const dynamic = "force-static";

export default function PaymentSuccessPage() {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-10 max-w-md w-full text-center">
				<div className="text-5xl mb-4">✅</div>
				<h1 className="text-2xl font-bold text-white mb-2">
					Payment Successful!
				</h1>
				<p className="text-sm text-[var(--color-text-muted)] mb-6">
					Thank you! Your payment has been received. We&apos;ll be in touch with
					next steps.
				</p>
				<Link
					href="/portal/dashboard"
					className="inline-block px-6 py-3 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors"
				>
					Return to Dashboard →
				</Link>
			</div>
		</div>
	);
}
