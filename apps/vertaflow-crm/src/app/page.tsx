import {
	ArrowRight,
	CheckCircle2,
	MonitorSmartphone,
	Receipt,
	Repeat,
} from "lucide-react";

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-[var(--color-bg-dark)] font-[family-name:var(--font-main)] flex flex-col pt-20">
			{/* Navbar Placeholder - Just absolute for now */}
			<nav className="absolute top-0 w-full px-6 py-6 flex justify-between items-center z-50">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
						DBA
					</div>
					<span className="text-white font-[family-name:var(--font-display)] font-semibold text-lg tracking-tight">
						Designed by Anthony
					</span>
				</div>
				<div className="flex items-center gap-4">
					<a
						href="https://portal.designedbyanthony.com"
						className="text-sm font-medium text-[var(--color-text-muted)] hover:text-white transition-colors"
					>
						Client Login
					</a>
					<a
						href="#book"
						className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/5"
					>
						Book a Call
					</a>
				</div>
			</nav>

			{/* Hero Section */}
			<main className="flex-1">
				<section className="px-4 pt-20 pb-24 md:pt-32 md:pb-32 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
					<div
						className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide mb-8 animate-fade-in"
						style={{ animationDelay: "0.1s", animationFillMode: "both" }}
					>
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
						</span>
						Now Accepting New Projects
					</div>

					<h1
						className="text-5xl md:text-7xl font-bold text-white font-[family-name:var(--font-display)] tracking-tight leading-[1.1] mb-6 max-w-4xl animate-fade-in"
						style={{ animationDelay: "0.2s", animationFillMode: "both" }}
					>
						We build websites that{" "}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
							print money.
						</span>
					</h1>

					<p
						className="text-lg md:text-xl text-[var(--color-text-gray)] mb-10 max-w-2xl leading-relaxed animate-fade-in"
						style={{ animationDelay: "0.3s", animationFillMode: "both" }}
					>
						Stop hunting for updates in your inbox. When you hire Designed by
						Anthony, you get a custom portal to track milestones, view
						interactive design proofs, and manage invoices all in one place.
					</p>

					<div
						className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in"
						style={{ animationDelay: "0.4s", animationFillMode: "both" }}
					>
						<a
							href="#book"
							className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
						>
							Book a Strategy Call
							<ArrowRight size={18} />
						</a>
						<a
							href="https://portal.designedbyanthony.com"
							className="px-8 py-4 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-white font-medium rounded-full border border-[var(--color-glass-border)] transition-all flex items-center justify-center hover:scale-105 active:scale-95"
						>
							View Client Portal Demo
						</a>
					</div>

					{/* Abstract Dashboard Preview Element */}
					<div
						className="mt-20 w-full max-w-5xl rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface-1)]/50 backdrop-blur-3xl overflow-hidden shadow-2xl relative animate-fade-in"
						style={{ animationDelay: "0.5s", animationFillMode: "both" }}
					>
						<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

						{/* Fake Window Controls */}
						<div className="flex items-center px-4 py-3 border-b border-[var(--color-glass-border)] bg-[var(--color-surface-2)]/50">
							<div className="flex gap-1.5">
								<div className="w-3 h-3 rounded-full bg-red-400/80"></div>
								<div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
								<div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
							</div>
							<div className="mx-auto text-xs font-medium text-[var(--color-text-muted)] font-mono">
								portal.designedbyanthony.com
							</div>
						</div>

						{/* Mock Portal Content */}
						<div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
							<div className="md:col-span-2 space-y-6">
								<div>
									<h3 className="text-xl font-bold text-white mb-1">
										Welcome back, Sarah
									</h3>
									<p className="text-sm text-[var(--color-text-gray)]">
										Apex Contracting project dashboard
									</p>
								</div>

								{/* Pipeline Mock */}
								<div className="rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-5 backdrop-blur-sm">
									<div className="flex items-center gap-3 mb-4">
										<div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
										<span className="font-semibold text-white">
											In Development
										</span>
									</div>
									<div className="w-full bg-[var(--color-surface-3)] h-2 rounded-full overflow-hidden">
										<div className="bg-gradient-to-r from-blue-500 to-emerald-500 w-[60%] h-full rounded-full"></div>
									</div>
								</div>

								{/* Staging Preview Mock */}
								<div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 backdrop-blur-sm flex justify-between items-center group cursor-pointer hover:bg-blue-500/10 transition-colors">
									<div>
										<h4 className="font-semibold text-white mb-1">
											Interactive Design Validation
										</h4>
										<p className="text-xs text-[var(--color-text-gray)]">
											Your staging site has been updated. Review on Mobile &
											Desktop.
										</p>
									</div>
									<div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
										<MonitorSmartphone size={18} />
									</div>
								</div>
							</div>

							{/* Tasks Mock */}
							<div className="space-y-4">
								<div className="rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-5 backdrop-blur-sm h-full">
									<h4 className="text-sm font-semibold text-white mb-4">
										Action Items
									</h4>
									<div className="space-y-3">
										<div className="flex items-center gap-3 opacity-50 line-through">
											<CheckCircle2 size={16} className="text-emerald-500" />
											<span className="text-sm text-white">
												Sign electronic proposal
											</span>
										</div>
										<div className="flex items-center gap-3 opacity-50 line-through">
											<CheckCircle2 size={16} className="text-emerald-500" />
											<span className="text-sm text-white">
												Pay $5,000 down payment
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-4 h-4 rounded border border-[var(--color-glass-border)] shrink-0"></div>
											<span className="text-sm text-white font-medium text-amber-100 items-center drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
												Review staging site
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Benefits Section */}
				<section className="py-24 border-t border-[var(--color-glass-border)] bg-[var(--color-surface-1)]">
					<div className="max-w-7xl mx-auto px-4">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-5xl font-bold text-white font-[family-name:var(--font-display)] mb-4">
								The ultimate client experience.
							</h2>
							<p className="text-lg text-[var(--color-text-gray)] max-w-2xl mx-auto">
								We don&apos;t just build websites; we build a frictionless
								partnership. Here&apos;s what you get when you hire us.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Feature 1 */}
							<div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] p-8 hover:border-blue-500/30 transition-colors group">
								<div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
									<MonitorSmartphone size={24} />
								</div>
								<h3 className="text-xl font-bold text-white mb-3">
									Live Interactive Proofs
								</h3>
								<p className="text-[var(--color-text-gray)] leading-relaxed">
									Test your unreleased website directly inside your portal.
									Switch between desktop, tablet, and mobile views instantly.
								</p>
							</div>

							{/* Feature 2 */}
							<div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] p-8 hover:border-emerald-500/30 transition-colors group">
								<div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
									<Receipt size={24} />
								</div>
								<h3 className="text-xl font-bold text-white mb-3">
									Automated Billing
								</h3>
								<p className="text-[var(--color-text-gray)] leading-relaxed">
									No more messy PDFs. Pay your milestone invoices and monthly
									SEO or hosting retainers directly through Stripe.
								</p>
							</div>

							{/* Feature 3 */}
							<div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface-2)] p-8 hover:border-purple-500/30 transition-colors group">
								<div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
									<Repeat size={24} />
								</div>
								<h3 className="text-xl font-bold text-white mb-3">
									Milestone Flow
								</h3>
								<p className="text-[var(--color-text-gray)] leading-relaxed">
									Always know exactly what stage your project is in without
									having to ask. From discovery to deployment.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="py-8 border-t border-[var(--color-glass-border)] bg-[var(--color-bg-dark)] px-4 text-center text-sm text-[var(--color-text-muted)]">
				&copy; {new Date().getFullYear()} Designed by Anthony. All rights
				reserved.
			</footer>
		</div>
	);
}
