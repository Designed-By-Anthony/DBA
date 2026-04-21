export const dynamic = "force-dynamic";

import {
	AlertTriangle,
	Clock,
	GitBranch,
	ListTodo,
	Mail,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { RevenueChart } from "@/components/ui/RevenueChart";
import VerticalDashboard from "@/components/vertical/VerticalDashboard";
import type { EmailRecord, Prospect } from "@/lib/types";
import { getDashboardStats, getEmailHistory, getProspects } from "./actions";

export default async function AdminPage() {
	let stats = null;
	let recentProspects: Prospect[] = [];
	let recentEmails: EmailRecord[] = [];

	try {
		[stats, recentProspects, recentEmails] = await Promise.all([
			getDashboardStats(),
			getProspects(),
			getEmailHistory(),
		]);
	} catch (e: unknown) {
		console.error("Dashboard data error:", e);
	}

	const kpis = [
		{
			label: "Total Prospects",
			value: stats?.totalProspects || 0,
			icon: Users,
			color: "var(--color-brand)",
			href: "/admin/prospects",
		},
		{
			label: "Emails Sent",
			value: stats?.emailsSent || 0,
			icon: Mail,
			color: "var(--color-success)",
			href: "/admin/email/history",
		},
		{
			label: "Scheduled",
			value: stats?.emailsScheduled || 0,
			icon: Clock,
			color: "var(--color-warning)",
			href: "/admin/automations",
		},
		{
			label: "Weighted forecast",
			value: `$${(stats?.weightedPipelineValue ?? stats?.forecastedMrr ?? 0).toLocaleString()}`,
			icon: TrendingUp,
			color: "var(--color-brand)",
			href: "/admin/pipeline",
		},
		{
			label: "Pipeline Value",
			value: `$${(stats?.pipelineValue || 0).toLocaleString()}`,
			icon: TrendingUp,
			color: "var(--color-info)",
			href: "/admin/pipeline",
		},
		{
			label: "Pipeline Velocity",
			value: `${stats?.pipelineVelocityDays || 0} days`,
			icon: Clock,
			color: "var(--color-warning)",
			href: "/admin/pipeline",
		},
		{
			label: "Stale leads (14d+)",
			value: stats?.staleLeadCount ?? 0,
			icon: AlertTriangle,
			color: "var(--color-warning)",
			href: "/admin/prospects",
		},
		{
			label: "Tasks overdue",
			value: stats?.overdueOpenTasksCount ?? 0,
			icon: ListTodo,
			color: "rgb(248 113 113)",
			href: "/admin/prospects",
		},
	];

	const atRiskProspects = recentProspects.filter(
		(p) => p.healthStatus === "at_risk" || p.healthStatus === "churn_risk",
	);

	const today = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="space-y-6">
			{/* Date subheader */}
			<p className="text-xs text-text-muted tracking-wide animate-fade-in">
				{today}
			</p>

			{/* KPI Row */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					return (
						<Link
							href={kpi.href}
							key={kpi.label}
							className={`glass-card kpi-card p-5 animate-fade-up stagger-${i + 1} block transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none`}
							style={
								{
									"--kpi-accent": kpi.color,
									boxShadow: "var(--kpi-accent) 0 0 0 -5px inset",
								} as React.CSSProperties
							}
						>
							<div className="flex items-start justify-between mb-3">
								<div
									className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
									style={{
										backgroundColor: `color-mix(in srgb, ${kpi.color} 12%, transparent)`,
									}}
								>
									<Icon size={20} style={{ color: kpi.color }} />
								</div>
								<div
									className="w-2 h-2 rounded-full mt-1 opacity-80"
									style={{ backgroundColor: kpi.color }}
								/>
							</div>
							<p className="text-2xl font-bold text-white group-hover:text-(--kpi-accent) transition-colors">
								{kpi.value}
							</p>
							<p className="text-xs text-text-muted mt-1 flex items-center justify-between">
								{kpi.label}
								<span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-[10px]">
									&rarr;
								</span>
							</p>
						</Link>
					);
				})}
			</div>

			{/* Quick Actions */}
			<div className="flex flex-wrap gap-3 animate-fade-up stagger-5">
				<Link
					href="/admin/prospects"
					className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-all shadow-(--color-brand-glow) hover:-translate-y-0.5"
				>
					<Users size={15} />
					View All Prospects
				</Link>
				<Link
					href="/admin/email"
					className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-white text-sm font-medium border border-glass-border hover:border-glass-border-hover transition-all hover:-translate-y-0.5"
				>
					<Mail size={15} />
					Compose Email
				</Link>
				<Link
					href="/admin/pipeline"
					className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-white text-sm font-medium border border-glass-border hover:border-glass-border-hover transition-all hover:-translate-y-0.5"
				>
					<GitBranch size={15} />
					Pipeline View
				</Link>
			</div>

			{atRiskProspects.length > 0 && (
				<div className="glass-card overflow-hidden border border-red-500/30 animate-fade-up stagger-5 bg-red-500/5">
					<div className="px-5 py-3 border-b border-red-500/20 flex justify-between items-center bg-red-500/10">
						<h3 className="text-sm font-bold text-red-100 flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
							AI Intelligence: Attention Needed
						</h3>
						<span className="text-xs text-red-200">Anti-Churn Engine</span>
					</div>
					<div className="divide-y divide-red-500/10">
						{atRiskProspects.map((p) => (
							<div key={p.id} className="px-5 py-3 flex items-center gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm text-red-100 font-medium">
										{p.name}{" "}
										<span className="text-white/50 text-xs ml-1">
											({p.status})
										</span>
									</p>
									<p className="text-xs text-red-300">
										High-risk detected based on engagement gaps and/or ticket
										friction.
									</p>
								</div>
								<Link
									href={`/admin/prospects/${p.id}`}
									className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs rounded transition-colors"
								>
									Intervene
								</Link>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Chameleon (Augusta) vertical-specific workspace */}
			<VerticalDashboard />

			{/* Revenue Forecast Visualization */}
			<div className="glass-card p-6 animate-fade-up stagger-5 mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-sm font-semibold text-white">
							Pipeline forecast
						</h3>
						<p className="text-xs text-text-muted">
							Raw pipeline value vs stage-weighted forecast (probabilities from
							your pipeline settings).
						</p>
					</div>
				</div>
				<RevenueChart
					data={[
						{ name: "Jan", value: 0, forecast: 0 },
						{ name: "Feb", value: 0, forecast: 0 },
						{
							name: "Mar",
							value: (stats?.pipelineValue || 0) * 0.1,
							forecast:
								(stats?.weightedPipelineValue ?? stats?.forecastedMrr ?? 0) *
								0.5,
						},
						{
							name: "Apr",
							value: (stats?.pipelineValue || 0) * 0.4,
							forecast:
								(stats?.weightedPipelineValue ?? stats?.forecastedMrr ?? 0) *
								0.8,
						},
						{
							name: "May",
							value: stats?.pipelineValue || 0,
							forecast:
								stats?.weightedPipelineValue ?? stats?.forecastedMrr ?? 0,
						},
					]}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent Prospects */}
				<div className="glass-card overflow-hidden animate-fade-up stagger-5">
					<div className="px-5 py-4 border-b border-glass-border flex justify-between items-center">
						<h3 className="text-sm font-semibold text-white">
							Recent Prospects
						</h3>
						<Link
							href="/admin/prospects"
							className="text-xs text-(--color-brand) hover:underline"
						>
							View All →
						</Link>
					</div>
					<div className="divide-y divide-glass-border">
						{recentProspects.length === 0 ? (
							<div className="p-8 text-center">
								<p className="text-sm text-text-muted">No prospects yet</p>
								<Link
									href="/admin/prospects"
									className="text-xs text-(--color-brand) hover:underline mt-2 inline-block"
								>
									Add your first prospect →
								</Link>
							</div>
						) : (
							recentProspects.slice(0, 5).map((p) => (
								<Link
									href={`/admin/prospects/${p.id}`}
									key={p.id}
									className="px-5 py-3 flex items-center gap-3 hover:bg-surface-3 transition-colors cursor-pointer group"
								>
									<div className="w-8 h-8 rounded-full bg-brand-subtle flex items-center justify-center text-white text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
										{p.name?.charAt(0)?.toUpperCase() || "?"}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm text-white truncate flex items-center gap-2 group-hover:text-(--color-brand) transition-colors">
											{p.name}
											{p.leadScore !== undefined && (
												<span
													className="text-[10px] text-(--color-brand) bg-brand-subtle rounded px-1"
													title="Lead Score"
												>
													⭐️ {p.leadScore}
												</span>
											)}
										</p>
										<p className="text-xs text-text-muted truncate">
											{p.email || p.company || "No email"}
										</p>
									</div>
									<span
										className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
											p.status === "launched"
												? "bg-emerald-500/10 text-emerald-400"
												: p.status === "dev"
													? "bg-blue-500/10 text-blue-400"
													: p.status === "proposal"
														? "bg-amber-500/10 text-amber-400"
														: p.status === "contacted"
															? "bg-sky-500/10 text-sky-400"
															: "bg-purple-500/10 text-purple-400"
										}`}
									>
										{p.status}
									</span>
								</Link>
							))
						)}
					</div>
				</div>

				{/* Recent Emails */}
				<div className="glass-card overflow-hidden animate-fade-up stagger-6">
					<div className="px-5 py-4 border-b border-glass-border flex justify-between items-center">
						<h3 className="text-sm font-semibold text-white">Recent Emails</h3>
						<Link
							href="/admin/email/history"
							className="text-xs text-(--color-brand) hover:underline"
						>
							View All →
						</Link>
					</div>
					<div className="divide-y divide-glass-border">
						{recentEmails.length === 0 ? (
							<div className="p-8 text-center">
								<p className="text-sm text-text-muted">No emails sent yet</p>
								<Link
									href="/admin/email"
									className="text-xs text-(--color-brand) hover:underline mt-2 inline-block"
								>
									Compose your first email →
								</Link>
							</div>
						) : (
							recentEmails.slice(0, 5).map((e) => (
								<div
									key={e.id}
									className="px-5 py-3 flex items-center gap-3 hover:bg-surface-3 transition-colors"
								>
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
											e.status === "sent"
												? "bg-emerald-500/10 text-emerald-400"
												: e.status === "scheduled"
													? "bg-amber-500/10 text-amber-400"
													: e.status === "failed"
														? "bg-red-500/10 text-red-400"
														: "bg-white/5 text-text-muted"
										}`}
									>
										<Mail size={14} />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm text-white truncate">{e.subject}</p>
										<p className="text-xs text-text-muted truncate">
											To: {e.prospectName}
										</p>
									</div>
									<div className="text-right shrink-0">
										<p className="text-xs text-text-muted">
											{e.opens || 0} opens ·{" "}
											{Array.isArray(e.clicks) ? e.clicks.length : 0} clicks
										</p>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
