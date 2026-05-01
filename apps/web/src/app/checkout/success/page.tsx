/**
 * /checkout/success — post-payment provisioning confirmation.
 *
 * Shown after a successful Stripe checkout. Communicates the 24-48 hour
 * bespoke brand-integration window before environment access is granted.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { btnOutline, btnPrimary } from "@/design-system/buttons";
import { BESPOKE_CONFIG_DESCRIPTION } from "@/lib/offers";
import { CheckoutTimeline } from "./CheckoutTimeline";

export const metadata: Metadata = {
	title: "Payment Received — Your Build Is Starting",
	description:
		"Your payment was received. Your environment is being provisioned — access is granted 24-48 hours after our design sync to ensure brand mapping meets the ANTHONY. standard.",
	robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center px-5 py-[clamp(4rem,10vw,8rem)] bg-[#0a0c10]">
			{/* Ambient glow */}
			<div
				className="pointer-events-none fixed inset-0 z-0"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 60% 45% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 70%)",
				}}
			/>

			<div className="relative z-10 w-full max-w-[38rem] flex flex-col items-center gap-8 text-center">
				{/* Success icon */}
				<div
					className="flex items-center justify-center w-16 h-16 rounded-full border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.08)] shadow-[0_0_40px_-12px_rgba(212,175,55,0.45)]"
					aria-hidden="true"
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(212,175,55,0.95)"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>

				{/* Heading */}
				<div className="flex flex-col gap-3">
					<p
						className="text-[0.7rem] font-extrabold tracking-[0.22em] uppercase text-[rgba(212,175,55,0.85)]"
						aria-label="Payment received"
					>
						Payment received
					</p>
					<h1 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.6rem)] font-bold tracking-[-0.032em] leading-[1.12] text-white m-0">
						Your environment is being provisioned.
					</h1>
					<p className="text-[1rem] leading-[1.78] text-[rgba(247,244,238,0.68)] m-0">
						{BESPOKE_CONFIG_DESCRIPTION}
					</p>
				</div>

				{/* Timeline */}
				<CheckoutTimeline />

				{/* Actions */}
				<div className="flex flex-wrap justify-center gap-3 mt-2">
					<Link href="/contact" className={btnPrimary}>
						Let&apos;s build something great.
					</Link>
					<Link href="/" className={btnOutline}>
						Back to Home
					</Link>
				</div>

				{/* Fine print */}
				<p className="text-[0.74rem] leading-[1.7] text-[rgba(247,244,238,0.32)] max-w-[30rem]">
					You will receive a confirmation email shortly. If you have questions,
					reply to that email or{" "}
					<Link
						href="/contact"
						className="text-[rgba(212,175,55,0.7)] underline underline-offset-2 hover:text-[rgba(212,175,55,1)] transition-colors duration-150"
					>
						contact us directly
					</Link>
					.
				</p>
			</div>
		</main>
	);
}
