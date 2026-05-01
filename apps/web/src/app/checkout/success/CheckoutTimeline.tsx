"use client";

/**
 * Four-step provisioning timeline shown on the /checkout/success page.
 *
 * Steps:
 *  1. Payment Received   — completed (solid bronze)
 *  2. Design Meeting     — pending   (muted)
 *  3. Brand Integration  — in progress (shimmer animation at 0.05 opacity)
 *  4. Production Launch  — 48h       (muted)
 *
 * Intentionally keeps framer-motion out of this component — uses only
 * CSS animations so the page stays fast and doesn't pull in the
 * animation bundle just for a success state.
 */

const STEPS = [
	{
		id: "payment",
		label: "Payment Received",
		sub: "Confirmed",
		state: "done",
	},
	{
		id: "meeting",
		label: "Design Meeting",
		sub: "Schedule via email",
		state: "pending",
	},
	{
		id: "brand",
		label: "Brand Integration",
		sub: "Post design sync — ANTHONY. standard",
		state: "active",
	},
	{
		id: "launch",
		label: "Production Launch",
		sub: "~48h post design sync",
		state: "pending",
	},
] as const;

type StepState = "done" | "active" | "pending";

function stepDotClass(state: StepState): string {
	if (state === "done")
		return "w-3 h-3 rounded-full bg-[rgba(212,175,55,0.95)] shadow-[0_0_10px_2px_rgba(212,175,55,0.35)]";
	if (state === "active")
		return "w-3 h-3 rounded-full border-2 border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.15)]";
	return "w-3 h-3 rounded-full border border-[rgba(255,255,255,0.18)] bg-transparent";
}

function stepLabelClass(state: StepState): string {
	if (state === "done") return "text-[rgba(247,244,238,0.92)] font-semibold";
	if (state === "active") return "text-[rgba(212,175,55,0.9)] font-semibold";
	return "text-[rgba(247,244,238,0.38)]";
}

function stepSubClass(state: StepState): string {
	if (state === "done") return "text-[rgba(212,175,55,0.7)]";
	if (state === "active") return "text-[rgba(212,175,55,0.55)]";
	return "text-[rgba(247,244,238,0.25)]";
}

export function CheckoutTimeline() {
	return (
		<div
			className="w-full text-bubble is-bordered flex flex-col gap-0"
			role="list"
			aria-label="Provisioning steps"
		>
			{STEPS.map((step, i) => {
				const isLast = i === STEPS.length - 1;
				const isActive = step.state === "active";
				return (
					<div
						key={step.id}
						role="listitem"
						className="relative flex gap-4"
					>
						{/* Vertical connector line */}
						<div className="flex flex-col items-center shrink-0">
							<div className="mt-[1.1rem]">{/* top spacing to centre dot */}</div>
							<div className={stepDotClass(step.state)} />
							{!isLast && (
								<div className="flex-1 w-px bg-[rgba(255,255,255,0.09)] mt-1 mb-0 min-h-[2rem]" />
							)}
						</div>

						{/* Content */}
						<div
							className={`relative pb-5 flex-1 overflow-hidden ${isActive ? "rounded-md" : ""}`}
						>
							{/* Shimmer overlay on the "In Progress" step (0.05 opacity — Atelier feel) */}
							{isActive && (
								<span
									aria-hidden="true"
									className="pointer-events-none absolute inset-0 rounded-md"
									style={{
										background:
											"linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.05) 50%, transparent 100%)",
										backgroundSize: "200% 100%",
										animation: "checkout-shimmer 2.8s ease-in-out infinite",
									}}
								/>
							)}
							<p
								className={`text-[0.9rem] leading-snug m-0 mt-[0.55rem] ${stepLabelClass(step.state)}`}
							>
								{step.label}
							</p>
							<p
								className={`text-[0.74rem] leading-snug m-0 mt-[0.2rem] ${stepSubClass(step.state)}`}
							>
								{step.sub}
							</p>
						</div>
					</div>
				);
			})}

			<style>{`
				@keyframes checkout-shimmer {
					0%   { background-position: -100% 0; }
					100% { background-position: 200% 0; }
				}
			`}</style>
		</div>
	);
}
