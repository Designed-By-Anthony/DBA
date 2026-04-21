"use client";

import { legalConfig } from "@/lib/legal.config";

export default function PrivacyPolicyPage() {
	const c = legalConfig;

	return (
		<div className="max-w-3xl mx-auto py-12 px-6 text-[var(--color-text-secondary)]">
			<h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
			<p className="text-sm mb-8 text-[var(--color-text-muted)]">
				Effective Date: {c.effectiveDate} &middot; Last Updated: {c.lastUpdated}
			</p>

			<section className="space-y-6 leading-relaxed text-sm">
				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						1. Information We Collect
					</h2>
					<p>
						<strong className="text-white">Account Information:</strong> Name,
						email address, organization name, and billing details provided
						during registration via Clerk authentication.
					</p>
					<p className="mt-2">
						<strong className="text-white">CRM Data:</strong> Leads, contacts,
						appointments, orders, inventory, and other business data you input.
						This data belongs to you and is scoped exclusively to your
						organization.
					</p>
					<p className="mt-2">
						<strong className="text-white">Usage Data:</strong> Page views,
						feature usage, error logs, and performance metrics collected via
						Sentry and Vercel Analytics (no PII is logged at info level).
					</p>
					<p className="mt-2">
						<strong className="text-white">Files & Media:</strong> Images, PDFs,
						and documents uploaded are stored in Cloudflare R2 object storage.
						Only URL references are stored in our database.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						2. How We Use Your Information
					</h2>
					<ul className="list-disc pl-6 space-y-1">
						<li>
							Provide, operate, and maintain the {c.platformName} platform
						</li>
						<li>
							Process transactions and send related information (receipts,
							invoices)
						</li>
						<li>
							Send email communications you initiate through our CRM tools
						</li>
						<li>Respond to support requests and troubleshoot issues</li>
						<li>Monitor and analyze usage to improve the platform</li>
						<li>Detect, prevent, and address fraud and security issues</li>
					</ul>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						3. Data Sharing
					</h2>
					<p>
						We do not sell your personal information. We share data only with:
					</p>
					<ul className="list-disc pl-6 mt-2 space-y-1">
						<li>
							<strong className="text-white">Clerk</strong> — Authentication and
							identity management
						</li>
						<li>
							<strong className="text-white">Stripe</strong> — Payment
							processing and subscription billing
						</li>
						<li>
							<strong className="text-white">Neon</strong> — Database hosting
							(encrypted in transit and at rest)
						</li>
						<li>
							<strong className="text-white">Cloudflare R2</strong> — File and
							media storage
						</li>
						<li>
							<strong className="text-white">Resend</strong> — Transactional and
							marketing email delivery
						</li>
						<li>
							<strong className="text-white">Sentry</strong> — Error monitoring
							(PII is scrubbed)
						</li>
						<li>
							<strong className="text-white">Vercel</strong> — Application
							hosting and analytics
						</li>
						<li>
							<strong className="text-white">Google Gemini</strong> — AI-powered
							onboarding assistance (conversation data is not stored by Google)
						</li>
					</ul>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						4. Data Security
					</h2>
					<ul className="list-disc pl-6 space-y-1">
						<li>All data transmitted over TLS 1.3 encryption</li>
						<li>Database connections use SSL with certificate verification</li>
						<li>
							Row-level security (RLS) enforces strict tenant data isolation
						</li>
						<li>No cross-tenant data access is possible by design</li>
						<li>
							API keys and secrets stored as environment variables, never in
							source code
						</li>
						<li>Session replay and full DOM capture are disabled by default</li>
					</ul>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						5. Data Retention
					</h2>
					<p>
						We retain your data for as long as your account is active. Upon
						account deletion:
					</p>
					<ul className="list-disc pl-6 mt-2 space-y-1">
						<li>CRM data is deleted within 30 days</li>
						<li>Files in R2 storage are deleted within 30 days</li>
						<li>Backups containing your data are purged within 90 days</li>
						<li>Anonymized usage analytics may be retained indefinitely</li>
					</ul>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						6. Your Rights
					</h2>
					<p>You have the right to:</p>
					<ul className="list-disc pl-6 mt-2 space-y-1">
						<li>
							<strong className="text-white">Access</strong> — Request a copy of
							all data we hold about you
						</li>
						<li>
							<strong className="text-white">Rectification</strong> — Correct
							inaccurate personal data
						</li>
						<li>
							<strong className="text-white">Deletion</strong> — Request
							deletion of your data (&ldquo;right to be forgotten&rdquo;)
						</li>
						<li>
							<strong className="text-white">Portability</strong> — Export your
							data in a standard format
						</li>
						<li>
							<strong className="text-white">Objection</strong> — Opt out of
							non-essential data processing
						</li>
					</ul>
					<p className="mt-2">
						To exercise these rights, email{" "}
						<a
							href={`mailto:${c.privacyEmail}`}
							className="text-[var(--color-brand)] hover:underline"
						>
							{c.privacyEmail}
						</a>
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">7. Cookies</h2>
					<p>
						We use essential cookies for authentication (Clerk session) and
						preferences. We do not use advertising or third-party tracking
						cookies. Vercel Analytics uses privacy-friendly, cookie-less
						tracking.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						8. Children&apos;s Privacy
					</h2>
					<p>
						The Platform is not intended for use by individuals under 18 years
						of age. We do not knowingly collect personal information from
						children.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						9. CAN-SPAM Compliance
					</h2>
					<p>
						All marketing emails sent through {c.platformName} include: a valid
						physical mailing address, a clear unsubscribe mechanism, and
						accurate sender information. Unsubscribe requests are honored within
						10 business days.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">
						10. Changes to This Policy
					</h2>
					<p>
						We will notify you of material changes via email or in-app
						notification at least 30 days before they take effect.
					</p>
				</div>

				<div>
					<h2 className="text-lg font-semibold text-white mb-2">11. Contact</h2>
					<p>
						Questions? Contact{" "}
						<a
							href={`mailto:${c.privacyEmail}`}
							className="text-[var(--color-brand)] hover:underline"
						>
							{c.privacyEmail}
						</a>
					</p>
					<p className="mt-1">
						{c.entityName} &middot; {c.physicalAddress}
					</p>
				</div>
			</section>
		</div>
	);
}
