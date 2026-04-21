import Link from "next/link";

export default function PaymentCancelledPage() {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<div className="rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-10 max-w-md w-full text-center backdrop-blur-sm">
				<div className="text-5xl mb-4">↩️</div>
				<h1 className="text-xl font-bold text-white mb-2">Payment Cancelled</h1>
				<p className="text-sm text-[var(--color-text-muted)] mb-6">
					No worries — your payment wasn&apos;t processed. You can try again
					anytime.
				</p>
				<Link
					href="/portal/dashboard"
					className="inline-block px-6 py-3 rounded-lg bg-[var(--color-surface-2)] text-white text-sm font-medium hover:bg-[var(--color-surface-3)] transition-colors border border-[var(--color-glass-border)]"
				>
					Back to Dashboard
				</Link>
			</div>
		</div>
	);
}
