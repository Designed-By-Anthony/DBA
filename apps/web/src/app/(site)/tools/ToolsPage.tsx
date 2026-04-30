"use client";

import { useToolsStore } from "@/lib/store/useStore";
import styles from "./tools.module.css";

const PREVIEW_TOOLS = [
	{
		icon: "⚡",
		tag: "Coming Soon",
		title: "Lighthouse Batch Scanner",
		desc: "Audit multiple URLs at once and export a combined PDF report for client presentations.",
	},
	{
		icon: "📊",
		tag: "Coming Soon",
		title: "Local SEO Audit Kit",
		desc: "GMB profile checker, citation consistency report, and schema validator in one workflow.",
	},
	{
		icon: "🧩",
		tag: "Coming Soon",
		title: "Lead Form Builder",
		desc: "Drag-and-drop smart forms with spam guards, Zapier hooks, and CRM-ready JSON output.",
	},
	{
		icon: "🗺️",
		tag: "Coming Soon",
		title: "Service Area Map Generator",
		desc: "Generate embeddable service-area maps optimized for local SEO signals.",
	},
	{
		icon: "📧",
		tag: "Coming Soon",
		title: "Cold Outreach Sequencer",
		desc: "Personalized email sequences for web design agencies targeting local service businesses.",
	},
	{
		icon: "📈",
		tag: "Coming Soon",
		title: "Core Web Vitals Monitor",
		desc: "Weekly CWV snapshots with regression alerts sent straight to your inbox.",
	},
] as const;

export function ToolsPage() {
	const {
		waitlistEmail,
		waitlistStatus,
		waitlistError,
		setWaitlistEmail,
		submitWaitlist,
	} = useToolsStore();

	const isSubmitting = waitlistStatus === "submitting";
	const isSuccess = waitlistStatus === "success";

	return (
		<div className={styles.page}>
			<section className={styles.hero}>
				<p className={styles.badge}>
					<span className={styles.badgeDot} aria-hidden />
					Micro SaaS Store · Coming Soon
				</p>
				<h1 className={styles.heading}>
					Small tools. Real leverage for web studios.
				</h1>
				<p className={styles.subheading}>
					A curated set of single-purpose tools built for freelancers and small
					web agencies — priced to be grabbed without a procurement process. No
					subscriptions, no bloat. Join the waitlist to get early access and
					founding-rate pricing.
				</p>

				{isSuccess ? (
					<p className={styles.successMsg}>
						<span aria-hidden>✓</span> You are on the list. We will email you at
						launch.
					</p>
				) : (
					<form
						className={styles.form}
						onSubmit={(e) => {
							e.preventDefault();
							submitWaitlist();
						}}
					>
						<input
							type="email"
							className={styles.input}
							placeholder="your@email.com"
							value={waitlistEmail}
							onChange={(e) => setWaitlistEmail(e.target.value)}
							required
							aria-label="Email address for waitlist"
							disabled={isSubmitting}
						/>
						<button
							type="submit"
							className={styles.submitBtn}
							disabled={isSubmitting}
						>
							{isSubmitting ? "Joining…" : "Join Waitlist"}
						</button>
					</form>
				)}

				{waitlistError ? (
					<p className={styles.errorMsg}>{waitlistError}</p>
				) : null}

				{!isSuccess && (
					<p className={styles.formNote}>No spam. One email at launch.</p>
				)}
			</section>

			<section
				className={styles.previewSection}
				aria-labelledby="tools-preview-heading"
			>
				<p id="tools-preview-heading" className={styles.previewHeading}>
					What is coming
				</p>
				<div className={styles.grid}>
					{PREVIEW_TOOLS.map((tool) => (
						<article key={tool.title} className={styles.card}>
							<span className={styles.cardIcon} aria-hidden>
								{tool.icon}
							</span>
							<span className={styles.cardTag}>{tool.tag}</span>
							<h2 className={styles.cardTitle}>{tool.title}</h2>
							<p className={styles.cardDesc}>{tool.desc}</p>
						</article>
					))}
				</div>
			</section>
		</div>
	);
}
