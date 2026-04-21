import {
	ArrowRight,
	BadgeCheck,
	Boxes,
	ChartNoAxesCombined,
	CheckCircle2,
	LayoutDashboard,
	MessageSquareQuote,
	ShieldCheck,
	Sparkles,
	TabletSmartphone,
} from "lucide-react";

export const dynamic = "force-static";

const showcaseCards = [
	{
		title: "Adaptive workspace",
		copy:
			"Sidebars, pipelines, and labels reshape around your vertical so your team sees language that already makes sense.",
	},
	{
		title: "Client-ready portal",
		copy:
			"Send magic-link access for invoices, approvals, documents, and updates without handing clients a bloated internal dashboard.",
	},
	{
		title: "Ops without duct tape",
		copy:
			"Automations, follow-up flows, billing, and visibility live in one stack instead of six tabs and a spreadsheet.",
	},
];

const pricingTiers = [
	{
		name: "CRM Core",
		price: "$29",
		description: "Pipelines, contacts, tasks, and tenant-scoped workflows.",
		items: ["Custom stages", "Smart dashboard", "Team activity", "Mobile-ready PWA"],
	},
	{
		name: "Professional",
		price: "$49",
		description: "Adds automations, portal flows, billing visibility, and stronger reporting.",
		items: ["Email sequences", "Client portal", "Revenue tracking", "Priority support"],
		featured: true,
	},
	{
		name: "Full Stack",
		price: "$79",
		description: "For operators who want the whole system wrapped into one operating layer.",
		items: ["Advanced workflows", "Ops extensions", "Industry skinning", "White-glove onboarding"],
	},
];

const comparisonRows = [
	{
		label: "Terminology matches your business",
		vertaflow: "Vertical-aware",
		legacy: "One-size-fits-all",
	},
	{
		label: "Client access",
		vertaflow: "Magic-link portal",
		legacy: "Separate tools or seats",
	},
	{
		label: "Operational workflows",
		vertaflow: "Built into the same workspace",
		legacy: "Usually stitched together",
	},
	{
		label: "Brand fit",
		vertaflow: "Feels custom on day one",
		legacy: "Looks like generic SaaS",
	},
];

const proofPoints = [
	{
		icon: LayoutDashboard,
		title: "One front door",
		copy:
			"Marketing, product story, and login now live in one place so the handoff from interest to usage feels intentional.",
	},
	{
		icon: ChartNoAxesCombined,
		title: "A different CRM philosophy",
		copy:
			"VertaFlow bends toward the operator instead of forcing the operator to bend toward the software.",
	},
	{
		icon: ShieldCheck,
		title: "Zero-trust tenant scoping",
		copy:
			"Every serious workflow remains organization-scoped so growth does not come at the expense of isolation.",
	},
];

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-[var(--color-bg-dark)] text-white">
			<nav className="sticky top-0 z-40 border-b border-white/8 bg-[rgba(7,9,14,0.84)] backdrop-blur-xl">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
					<a href="/" className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/12 shadow-[0_0_30px_-12px_rgba(16,185,129,0.8)]">
							<Sparkles className="h-5 w-5 text-emerald-300" />
						</div>
						<div>
							<p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
								VertaFlow
							</p>
							<p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
								Adaptive CRM
							</p>
						</div>
					</a>

					<div className="hidden items-center gap-6 text-sm text-[var(--color-text-muted)] md:flex">
						<a href="#product" className="transition-colors hover:text-white">
							Product
						</a>
						<a href="#pricing" className="transition-colors hover:text-white">
							Pricing
						</a>
						<a href="#why" className="transition-colors hover:text-white">
							Why it wins
						</a>
						<a href="/sign-in" className="transition-colors hover:text-white">
							Login
						</a>
					</div>

					<div className="flex items-center gap-3">
						<a
							href="/sign-in"
							className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-400/40 hover:text-emerald-200 md:inline-flex"
						>
							Login
						</a>
						<a
							href="/admin"
							className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px] hover:bg-emerald-300"
						>
							Open CRM
							<ArrowRight className="h-4 w-4" />
						</a>
					</div>
				</div>
			</nav>

			<main>
				<section className="relative overflow-hidden px-4 pb-20 pt-18 md:px-6 md:pb-28 md:pt-24">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(96,165,250,0.14),transparent_22%)]" />
					<div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
						<div>
							<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
								<span className="h-2 w-2 rounded-full bg-emerald-300" />
								One CRM. Every vertical. Your way.
							</div>
							<h1 className="max-w-4xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
								VertaFlow lands where the work starts, not where the marketing ends.
							</h1>
							<p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-gray)] md:text-xl">
								This is the restored VertaFlow front door: a product-led landing page
								on the same app that powers the CRM. Operators can understand the
								approach, compare the model, and jump straight into login without
								leaving the experience.
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row">
								<a
									href="/sign-in"
									className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:translate-y-[-1px] hover:bg-emerald-300"
								>
									Login to VertaFlow
									<ArrowRight className="h-4 w-4" />
								</a>
								<a
									href="#pricing"
									className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/4 px-6 py-3.5 font-medium text-white transition hover:border-white/24 hover:bg-white/7"
								>
									See pricing and fit
								</a>
							</div>
							<div className="mt-10 grid gap-5 sm:grid-cols-3">
								<div>
									<p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
										1 place
									</p>
									<p className="mt-2 text-sm text-[var(--color-text-muted)]">
										Product story, sign-in, and CRM routing under one domain.
									</p>
								</div>
								<div>
									<p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
										Multi-vertical
									</p>
									<p className="mt-2 text-sm text-[var(--color-text-muted)]">
										Pipelines and language shift to fit the business instead of the reverse.
									</p>
								</div>
								<div>
									<p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
										Zero sprawl
									</p>
									<p className="mt-2 text-sm text-[var(--color-text-muted)]">
										Less tab chaos, fewer stitched tools, tighter operator flow.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
							<div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#0b1017]">
								<div className="flex items-center gap-2 border-b border-white/6 bg-white/4 px-4 py-3">
									<span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
									<span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
									<span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
									<div className="ml-auto rounded-full border border-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
										vertaflow.io
									</div>
								</div>
								<div className="grid gap-4 p-4 md:grid-cols-[150px_1fr]">
									<div className="space-y-2 rounded-2xl border border-white/6 bg-white/3 p-3">
										<p className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
											VertaFlow
										</p>
										{["Pipeline", "Inbox", "Billing", "Portal", "Automations"].map(
											(item, index) => (
												<div
													key={item}
													className={`rounded-xl px-3 py-2 text-xs ${
														index === 0
															? "bg-emerald-400/12 text-emerald-300"
															: "bg-white/4 text-[var(--color-text-muted)]"
													}`}
												>
													{item}
												</div>
											),
										)}
									</div>

									<div className="space-y-4">
										<div className="flex items-start justify-between gap-4 rounded-2xl border border-white/6 bg-white/3 p-4">
											<div>
												<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
													Operator snapshot
												</p>
												<h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
													Restaurant mode active
												</h2>
											</div>
											<div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
												Vertical skin applied
											</div>
										</div>

										<div className="grid gap-3 sm:grid-cols-3">
											{[
												["42", "Open guests"],
												["$8.4k", "This week"],
												["93%", "Replies within SLA"],
											].map(([value, label]) => (
												<div
													key={label}
													className="rounded-2xl border border-white/6 bg-white/3 p-4"
												>
													<p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
														{value}
													</p>
													<p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
														{label}
													</p>
												</div>
											))}
										</div>

										<div className="grid gap-3 sm:grid-cols-3">
											{[
												{
													title: "New inquiry",
													body: "Website lead entered the pipeline with automations armed.",
												},
												{
													title: "Proposal sent",
													body: "Client got a branded portal link instead of a thread of PDFs.",
												},
												{
													title: "Paid deposit",
													body: "Revenue and next-stage workflow moved forward automatically.",
												},
											].map((card) => (
												<div
													key={card.title}
													className="rounded-2xl border border-white/6 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.03))] p-4"
												>
													<p className="text-sm font-semibold text-white">{card.title}</p>
													<p className="mt-2 text-sm leading-6 text-[var(--color-text-gray)]">
														{card.body}
													</p>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="product" className="border-t border-white/8 px-4 py-18 md:px-6 md:py-24">
					<div className="mx-auto max-w-7xl">
						<div className="max-w-3xl">
							<p className="text-sm font-semibold uppercase tracking-[0.26em] text-emerald-300">
								Product showcase
							</p>
							<h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
								The version you had before, back where it belongs.
							</h2>
							<p className="mt-5 text-lg leading-8 text-[var(--color-text-gray)]">
								The landing is no longer a redirect accident. It now explains the
								product, shows the operating model, and still hands people cleanly into
								the live CRM.
							</p>
						</div>

						<div className="mt-10 grid gap-6 lg:grid-cols-3">
							{showcaseCards.map((card) => (
								<div
									key={card.title}
									className="rounded-[24px] border border-white/8 bg-white/4 p-6 backdrop-blur-sm"
								>
									<div className="inline-flex rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
										<Boxes className="h-5 w-5" />
									</div>
									<h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
										{card.title}
									</h3>
									<p className="mt-3 text-base leading-7 text-[var(--color-text-gray)]">
										{card.copy}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="pricing" className="border-t border-white/8 bg-white/[0.02] px-4 py-18 md:px-6 md:py-24">
					<div className="mx-auto max-w-7xl">
						<div className="max-w-3xl">
							<p className="text-sm font-semibold uppercase tracking-[0.26em] text-emerald-300">
								Pricing
							</p>
							<h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
								Simple tiers, with the operator story front and center.
							</h2>
						</div>

						<div className="mt-10 grid gap-6 xl:grid-cols-3">
							{pricingTiers.map((tier) => (
								<div
									key={tier.name}
									className={`rounded-[26px] border p-6 ${
										tier.featured
											? "border-emerald-400/35 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(255,255,255,0.04))] shadow-[0_28px_80px_-40px_rgba(16,185,129,0.55)]"
											: "border-white/8 bg-white/4"
									}`}
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
												{tier.name}
											</p>
											<p className="mt-2 text-sm leading-6 text-[var(--color-text-gray)]">
												{tier.description}
											</p>
										</div>
										{tier.featured ? (
											<div className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
												Best fit
											</div>
										) : null}
									</div>

									<div className="mt-8 flex items-end gap-2">
										<span className="font-[family-name:var(--font-display)] text-5xl font-semibold text-white">
											{tier.price}
										</span>
										<span className="pb-2 text-sm text-[var(--color-text-muted)]">/mo</span>
									</div>

									<ul className="mt-8 space-y-3">
										{tier.items.map((item) => (
											<li key={item} className="flex items-start gap-3 text-sm text-[var(--color-text-gray)]">
												<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
												<span>{item}</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="why" className="border-t border-white/8 px-4 py-18 md:px-6 md:py-24">
					<div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[0.95fr_1.05fr]">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.26em] text-emerald-300">
								Why this approach hits differently
							</p>
							<h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
								We did not want another generic CRM with your logo pasted on top.
							</h2>
							<p className="mt-5 text-lg leading-8 text-[var(--color-text-gray)]">
								VertaFlow is built around the idea that software should adopt the
								operator&apos;s mental model. That means less translation, faster
								throughput, and a product story you can actually feel in the interface.
							</p>

							<div className="mt-8 space-y-4">
								{proofPoints.map(({ icon: Icon, title, copy }) => (
									<div
										key={title}
										className="rounded-[22px] border border-white/8 bg-white/4 p-5"
									>
										<div className="flex items-start gap-4">
											<div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
												<Icon className="h-5 w-5" />
											</div>
											<div>
												<h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
													{title}
												</h3>
												<p className="mt-2 text-base leading-7 text-[var(--color-text-gray)]">
													{copy}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(88,166,255,0.08),rgba(255,255,255,0.03))] p-6">
							<div className="flex items-center justify-between gap-4 border-b border-white/8 pb-5">
								<div>
									<p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
										Comparison
									</p>
									<h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
										VertaFlow vs generic CRM
									</h3>
								</div>
								<div className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
									Opinionated by design
								</div>
							</div>

							<div className="mt-6 overflow-hidden rounded-[22px] border border-white/8">
								<div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
									<div>Category</div>
									<div>VertaFlow</div>
									<div>Typical legacy stack</div>
								</div>
								{comparisonRows.map((row) => (
									<div
										key={row.label}
										className="grid grid-cols-[1.2fr_0.9fr_0.9fr] border-t border-white/8 px-4 py-4 text-sm"
									>
										<div className="pr-4 text-white">{row.label}</div>
										<div className="pr-4 text-emerald-300">{row.vertaflow}</div>
										<div className="text-[var(--color-text-gray)]">{row.legacy}</div>
									</div>
								))}
							</div>

							<div className="mt-6 rounded-[22px] border border-emerald-400/20 bg-emerald-400/8 p-5">
								<div className="flex items-start gap-3">
									<MessageSquareQuote className="mt-1 h-5 w-5 text-emerald-300" />
									<p className="text-sm leading-7 text-emerald-100/90">
										The point is not to look different for the sake of it. The point is
										to remove friction the minute someone logs in.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="border-t border-white/8 px-4 py-18 md:px-6 md:py-24">
					<div className="mx-auto max-w-5xl rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(88,166,255,0.1),rgba(255,255,255,0.04))] p-8 text-center shadow-[0_32px_90px_-45px_rgba(16,185,129,0.7)] md:p-12">
						<div className="mx-auto inline-flex rounded-full border border-white/12 bg-white/7 p-3 text-emerald-300">
							<TabletSmartphone className="h-6 w-6" />
						</div>
						<h2 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
							VertaFlow is back on VertaFlow.
						</h2>
						<p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-emerald-50/85">
							The landing is restored, the CRM is still right behind it, and login is
							one click away. That&apos;s the clean version of the story.
						</p>
						<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
							<a
								href="/sign-in"
								className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:translate-y-[-1px]"
							>
								<BadgeCheck className="h-4 w-4" />
								Sign in
							</a>
							<a
								href="/admin"
								className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/7 px-6 py-3.5 font-medium text-white transition hover:bg-white/10"
							>
								Enter admin
							</a>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
