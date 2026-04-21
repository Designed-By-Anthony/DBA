"use client";

import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Circle,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	completeOnboardingStep,
	getOnboardingProgress,
} from "@/app/admin/legal/actions";

const ONBOARDING_STEPS = [
	{
		id: "org_created",
		label: "Create Organization",
		description: "Set up your workspace",
		auto: true,
	},
	{
		id: "legal_accepted",
		label: "Accept Terms & Privacy",
		description: "Review and accept our legal agreements",
		href: "/admin/legal/terms",
	},
	{
		id: "vertical_selected",
		label: "Select Your Industry",
		description: "Choose your vertical for a tailored experience",
		href: "/admin/settings",
	},
	{
		id: "first_lead",
		label: "Add First Lead",
		description: "Import or create your first contact",
		href: "/admin/clients",
	},
	{
		id: "email_setup",
		label: "Set Up Email",
		description: "Verify your sending domain",
		href: "/admin/settings",
	},
	{
		id: "stripe_connected",
		label: "Connect Payments",
		description: "Link Stripe for invoicing & POS",
		href: "/admin/settings",
	},
	{
		id: "pwa_installed",
		label: "Install Mobile App",
		description: "Get Agency OS on your phone",
		href: "#pwa",
	},
] as const;

export default function OnboardingFloater() {
	const [progress, setProgress] = useState<Record<string, boolean>>({});
	const [collapsed, setCollapsed] = useState(false);
	const [dismissed, setDismissed] = useState(
		() =>
			typeof window !== "undefined" &&
			localStorage.getItem("onboarding-dismissed") === "true",
	);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (dismissed) return;

		getOnboardingProgress()
			.then((p) => {
				setProgress(p);
				setLoaded(true);
			})
			.catch(() => setLoaded(true));
	}, [dismissed]);

	const completedCount = ONBOARDING_STEPS.filter((s) => progress[s.id]).length;
	const allComplete = completedCount === ONBOARDING_STEPS.length;
	const percentage = Math.round(
		(completedCount / ONBOARDING_STEPS.length) * 100,
	);

	if (dismissed || !loaded || allComplete) return null;

	const handleComplete = (stepId: string) => {
		(async () => {
			await completeOnboardingStep(stepId);
			setProgress((p) => ({ ...p, [stepId]: true }));
		})();
	};

	const handleDismiss = () => {
		localStorage.setItem("onboarding-dismissed", "true");
		setDismissed(true);
	};

	return (
		<div
			className="fixed bottom-6 right-6 z-50 w-[340px] rounded-2xl shadow-2xl border border-[var(--color-glass-border)] overflow-hidden"
			style={{
				background: "var(--color-surface-1)",
				backdropFilter: "blur(20px)",
				animation: "slideUp 0.4s ease-out",
			}}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
				onClick={() => setCollapsed(!collapsed)}
				style={{
					background:
						"linear-gradient(135deg, var(--color-brand), var(--color-brand-hover))",
				}}
			>
				<div className="flex items-center gap-2 text-white">
					<Sparkles size={18} />
					<span className="font-semibold text-sm">Setup Guide</span>
					<span className="text-xs opacity-80">
						{completedCount}/{ONBOARDING_STEPS.length}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<button
						onClick={(e) => {
							e.stopPropagation();
							handleDismiss();
						}}
						className="text-white/60 hover:text-white transition-colors p-1"
						title="Dismiss"
					>
						<X size={14} />
					</button>
					{collapsed ? (
						<ChevronUp size={16} className="text-white" />
					) : (
						<ChevronDown size={16} className="text-white" />
					)}
				</div>
			</div>

			{/* Progress bar */}
			<div className="h-1 bg-[var(--color-surface-2)]">
				<div
					className="h-full bg-emerald-400 transition-all duration-500"
					style={{ width: `${percentage}%` }}
				/>
			</div>

			{/* Steps */}
			{!collapsed && (
				<div className="p-3 space-y-1 max-h-[360px] overflow-y-auto">
					{ONBOARDING_STEPS.map((step) => {
						const done = progress[step.id];
						return (
							<div
								key={step.id}
								className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
									done
										? "opacity-60"
										: "hover:bg-[var(--color-surface-2)] cursor-pointer"
								}`}
								onClick={() => {
									if (done) return;
									if (step.id === "pwa_installed") {
										// Trigger PWA install
										handleComplete(step.id);
										return;
									}
									if ("href" in step && step.href) {
										window.location.href = step.href;
									}
								}}
							>
								{done ? (
									<CheckCircle2
										size={20}
										className="text-emerald-400 flex-shrink-0 mt-0.5"
									/>
								) : (
									<Circle
										size={20}
										className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5"
									/>
								)}
								<div className="min-w-0">
									<p
										className={`text-sm font-medium ${done ? "line-through text-[var(--color-text-muted)]" : "text-white"}`}
									>
										{step.label}
									</p>
									<p className="text-xs text-[var(--color-text-muted)] mt-0.5">
										{step.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			)}

			<style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
		</div>
	);
}
