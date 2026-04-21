"use client";

import type { EstimateLineItem } from "@dba/database";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	DollarSign,
	Eye,
	Receipt,
	RefreshCw,
	Search,
	Send,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCents } from "@/lib/currency";

type InvoiceRow = {
	id: string;
	invoiceNumber: string;
	prospectId: string | null;
	status: string;
	lineItems: EstimateLineItem[];
	totalCents: number;
	dueDate: string | null;
	paidAt: string | null;
	sentAt: string | null;
	stripePaymentUrl: string | null;
	createdAt: string;
};

const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; icon: typeof Receipt }
> = {
	draft: { label: "Draft", color: "#64748b", icon: Receipt },
	sent: { label: "Sent", color: "#3b82f6", icon: Send },
	paid: { label: "Paid", color: "#10b981", icon: CheckCircle },
	overdue: { label: "Overdue", color: "#ef4444", icon: AlertCircle },
	voided: { label: "Voided", color: "#6b7280", icon: XCircle },
	refunded: { label: "Refunded", color: "#f59e0b", icon: Clock },
};

export default function InvoicesPage() {
	const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [search, setSearch] = useState("");

	const loadInvoices = useCallback(async () => {
		setLoading(true);
		try {
			const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
			const res = await fetch(`/api/admin/invoices${params}`);
			const data = await res.json();
			setInvoices(data.invoices ?? []);
		} catch {
			toast.error("Failed to load invoices");
		}
		setLoading(false);
	}, [statusFilter]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadInvoices();
	}, [loadInvoices]);

	const filtered = invoices.filter((inv) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return (
			inv.invoiceNumber.toLowerCase().includes(q) ||
			(inv.prospectId?.toLowerCase().includes(q) ?? false)
		);
	});

	const totalRevenue = invoices
		.filter((i) => i.status === "paid")
		.reduce((s, i) => s + i.totalCents, 0);
	const totalOutstanding = invoices
		.filter((i) => i.status === "sent" || i.status === "overdue")
		.reduce((s, i) => s + i.totalCents, 0);

	async function handleSend(id: string) {
		try {
			await fetch("/api/admin/invoices", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, status: "sent" }),
			});
			toast.success("Invoice sent!");
			loadInvoices();
		} catch {
			toast.error("Failed to send invoice");
		}
	}

	async function handleMarkPaid(id: string) {
		try {
			await fetch("/api/admin/invoices", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, status: "paid" }),
			});
			toast.success("Marked as paid!");
			loadInvoices();
		} catch {
			toast.error("Failed to update invoice");
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
						<Receipt size={20} className="text-emerald-400" />
					</div>
					Invoices
				</h1>
				<p className="text-sm text-text-muted mt-1">
					Track payments and manage billing for your clients.
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{[
					{ label: "Total Invoices", value: invoices.length, color: "#6366f1" },
					{
						label: "Revenue Collected",
						value: formatCents(totalRevenue),
						color: "#10b981",
					},
					{
						label: "Outstanding",
						value: formatCents(totalOutstanding),
						color: "#f59e0b",
					},
					{
						label: "Paid",
						value: invoices.filter((i) => i.status === "paid").length,
						color: "#10b981",
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="rounded-xl border border-glass-border bg-surface-0/60 backdrop-blur-sm p-4"
					>
						<p className="text-[11px] text-text-muted uppercase tracking-wider">
							{stat.label}
						</p>
						<p className="text-xl font-bold text-white mt-1">{stat.value}</p>
						<div
							className="h-0.5 rounded-full mt-3"
							style={{
								background: `linear-gradient(to right, ${stat.color}, transparent)`,
							}}
						/>
					</div>
				))}
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3 flex-wrap">
				<div className="relative flex-1 max-w-xs">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
					/>
					<input
						type="text"
						placeholder="Search invoices..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand) transition-colors"
					/>
				</div>

				<div className="flex gap-1.5 bg-surface-1 p-1 rounded-lg border border-glass-border">
					{["all", "draft", "sent", "paid", "overdue"].map((s) => (
						<button
							key={s}
							onClick={() => setStatusFilter(s)}
							className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
								statusFilter === s
									? "bg-(--color-brand) text-white shadow-sm"
									: "text-text-muted hover:text-white hover:bg-surface-2"
							}`}
						>
							{s === "all" ? "All" : (STATUS_CONFIG[s]?.label ?? s)}
						</button>
					))}
				</div>

				<button
					onClick={loadInvoices}
					className="p-2 rounded-lg border border-glass-border text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
				>
					<RefreshCw size={16} className={loading ? "animate-spin" : ""} />
				</button>
			</div>

			{/* Table */}
			<div className="rounded-xl border border-glass-border bg-surface-0/60 backdrop-blur-sm overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-glass-border bg-surface-1/50">
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Invoice #
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Prospect
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Status
							</th>
							<th className="text-right py-3 px-4 text-text-muted font-medium">
								Amount
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Due Date
							</th>
							<th className="text-right py-3 px-4 text-text-muted font-medium">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<tr key={i} className="border-b border-glass-border/50">
									{Array.from({ length: 6 }).map((_, j) => (
										<td key={j} className="py-3.5 px-4">
											<div className="h-4 rounded bg-surface-2 animate-pulse" />
										</td>
									))}
								</tr>
							))
						) : filtered.length === 0 ? (
							<tr>
								<td colSpan={6} className="py-16 text-center">
									<Receipt
										size={40}
										className="mx-auto text-text-muted/30 mb-3"
									/>
									<p className="text-text-muted">No invoices yet</p>
									<p className="text-xs text-text-muted/60 mt-1">
										Invoices are generated from signed contracts.
									</p>
								</td>
							</tr>
						) : (
							filtered.map((inv) => {
								const config = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
								const StatusIcon = config.icon;
								return (
									<tr
										key={inv.id}
										className="border-b border-glass-border/50 hover:bg-surface-1/30 transition-colors group"
									>
										<td className="py-3.5 px-4 font-mono text-white font-medium">
											{inv.invoiceNumber}
										</td>
										<td className="py-3.5 px-4 text-text-muted">
											{inv.prospectId || "—"}
										</td>
										<td className="py-3.5 px-4">
											<span
												className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
												style={{
													background: `${config.color}20`,
													color: config.color,
												}}
											>
												<StatusIcon size={12} />
												{config.label}
											</span>
										</td>
										<td className="py-3.5 px-4 text-right text-white font-medium">
											{formatCents(inv.totalCents)}
										</td>
										<td className="py-3.5 px-4 text-text-muted text-xs">
											{inv.dueDate
												? new Date(inv.dueDate).toLocaleDateString()
												: "—"}
										</td>
										<td className="py-3.5 px-4 text-right">
											<div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												{inv.status === "draft" && (
													<button
														onClick={() => handleSend(inv.id)}
														className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400"
														title="Send"
													>
														<Send size={14} />
													</button>
												)}
												{(inv.status === "sent" ||
													inv.status === "overdue") && (
													<button
														onClick={() => handleMarkPaid(inv.id)}
														className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
														title="Mark Paid"
													>
														<DollarSign size={14} />
													</button>
												)}
												<button
													onClick={() =>
														toast.info("Invoice detail view coming soon")
													}
													className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-white"
													title="View"
												>
													<Eye size={14} />
												</button>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
