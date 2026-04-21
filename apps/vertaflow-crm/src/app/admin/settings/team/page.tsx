export const dynamic = "force-dynamic";

import { OrganizationProfile } from "@clerk/nextjs";

export default function TeamPage() {
	return (
		<div className="space-y-6 max-w-3xl">
			<div>
				<h1 className="text-xl font-bold text-white">Team Management</h1>
				<p className="text-xs text-text-muted mt-1">
					Manage team members, roles, and invitations
				</p>
			</div>

			<div className="glass-card overflow-hidden p-1">
				<OrganizationProfile
					routing="hash"
					appearance={{
						elements: {
							rootBox: "w-full",
							card: "bg-transparent shadow-none border-none w-full",
							navbar:
								"bg-[var(--color-surface-2)] border-[var(--color-glass-border)]",
							navbarButton: "text-[var(--color-text-gray)] hover:text-white",
							navbarButtonActive: "text-white bg-[var(--color-brand-subtle)]",
							headerTitle: "text-white",
							headerSubtitle: "text-[var(--color-text-muted)]",
							profileSectionTitle: "text-white",
							profileSectionContent: "text-[var(--color-text-muted)]",
							formFieldLabel: "text-[var(--color-text-muted)]",
							formFieldInput:
								"bg-[var(--color-surface-2)] border-[var(--color-glass-border)] text-white",
							formButtonPrimary:
								"bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]",
						},
					}}
				/>
			</div>
		</div>
	);
}
