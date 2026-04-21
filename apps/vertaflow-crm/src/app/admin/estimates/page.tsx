"use client";

import type { EstimateLineItem } from "@dba/database";
import {
	CheckCircle,
	ChevronDown,
	Clock,
	DollarSign,
	Eye,
	FileText,
	Plus,
	RefreshCw,
	Search,
	Send,
	Trash2,
	X,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { dollarsToCents, formatCents } from "@/lib/currency";
import { getStripeProducts, type StripeProductDetail } from "../actions/stripe";

type EstimateRow = {
	id: string;
	estimateNumber: string;
	prospectId: string | null;
	templateType: string;
	status: string;
	lineItems: EstimateLineItem[];
	proposalContent: string | null;
	terms: string | null;
	totalCents: number;
	sentAt: string | null;
	validUntil: string | null;
	viewedAt: string | null;
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
};

const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; icon: typeof FileText }
> = {
	draft: { label: "Draft", color: "#64748b", icon: FileText },
	sent: { label: "Sent", color: "#3b82f6", icon: Send },
	viewed: { label: "Viewed", color: "#f59e0b", icon: Eye },
	accepted: { label: "Accepted", color: "#10b981", icon: CheckCircle },
	declined: { label: "Declined", color: "#ef4444", icon: XCircle },
	expired: { label: "Expired", color: "#6b7280", icon: Clock },
};

export default function EstimatesPage() {
	const [estimates, setEstimates] = useState<EstimateRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const loadEstimates = useCallback(async () => {
		setLoading(true);
		try {
			const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
			const res = await fetch(`/api/admin/estimates${params}`);
			const data = await res.json();
			setEstimates(data.estimates ?? []);
		} catch {
			toast.error("Failed to load estimates");
		}
		setLoading(false);
	}, [statusFilter]);

	useEffect(() => {
		loadEstimates();
	}, [loadEstimates]);

	const filtered = estimates.filter((e) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return (
			e.estimateNumber.toLowerCase().includes(q) ||
			(e.prospectId?.toLowerCase().includes(q) ?? false)
		);
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
							<FileText size={20} className="text-blue-400" />
						</div>
						Estimates & Proposals
					</h1>
					<p className="text-sm text-text-muted mt-1">
						Create quotes from your Price Book, send proposals, and track
						approvals.
					</p>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-(--color-brand) to-blue-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
				>
					<Plus size={16} />
					New Estimate
				</button>
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
						placeholder="Search estimates..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand) transition-colors"
					/>
				</div>

				<div className="flex gap-1.5 bg-surface-1 p-1 rounded-lg border border-glass-border">
					{["all", "draft", "sent", "accepted", "declined"].map((s) => (
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
					onClick={loadEstimates}
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
								Number
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Prospect
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Type
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Status
							</th>
							<th className="text-right py-3 px-4 text-text-muted font-medium">
								Total
							</th>
							<th className="text-left py-3 px-4 text-text-muted font-medium">
								Created
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
									{Array.from({ length: 7 }).map((_, j) => (
										<td key={j} className="py-3.5 px-4">
											<div
												className="h-4 rounded bg-surface-2 animate-pulse"
												style={{ width: `${60 + j * 10}%` }}
											/>
										</td>
									))}
								</tr>
							))
						) : filtered.length === 0 ? (
							<tr>
								<td colSpan={7} className="py-16 text-center">
									<FileText
										size={40}
										className="mx-auto text-text-muted/30 mb-3"
									/>
									<p className="text-text-muted">No estimates yet</p>
									<p className="text-xs text-text-muted/60 mt-1">
										Create your first estimate to start quoting.
									</p>
								</td>
							</tr>
						) : (
							filtered.map((est) => {
								const config = STATUS_CONFIG[est.status] ?? STATUS_CONFIG.draft;
								const StatusIcon = config.icon;
								return (
									<tr
										key={est.id}
										className="border-b border-glass-border/50 hover:bg-surface-1/30 transition-colors group"
									>
										<td className="py-3.5 px-4 font-mono text-white font-medium">
											{est.estimateNumber}
										</td>
										<td className="py-3.5 px-4 text-text-muted">
											{est.prospectId || "—"}
										</td>
										<td className="py-3.5 px-4">
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 text-[11px] text-text-muted capitalize">
												{est.templateType}
											</span>
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
											{formatCents(est.totalCents)}
										</td>
										<td className="py-3.5 px-4 text-text-muted text-xs">
											{new Date(est.createdAt).toLocaleDateString()}
										</td>
										<td className="py-3.5 px-4 text-right">
											<div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												{est.status === "draft" && (
													<button
														onClick={() => handleSend(est.id)}
														className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
														title="Send to prospect"
													>
														<Send size={14} />
													</button>
												)}
												<button
													onClick={() =>
														toast.info("Estimate detail view coming soon")
													}
													className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-white transition-colors"
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

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{[
					{
						label: "Total Estimates",
						value: estimates.length,
						color: "#6366f1",
					},
					{
						label: "Pending",
						value: estimates.filter(
							(e) => e.status === "sent" || e.status === "viewed",
						).length,
						color: "#f59e0b",
					},
					{
						label: "Accepted",
						value: estimates.filter((e) => e.status === "accepted").length,
						color: "#10b981",
					},
					{
						label: "Revenue Quoted",
						value: formatCents(
							estimates.reduce((sum, e) => sum + e.totalCents, 0),
						),
						color: "#3b82f6",
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

			{/* Create Modal */}
			{showModal && (
				<CreateEstimateModal
					onClose={() => setShowModal(false)}
					onCreated={() => {
						setShowModal(false);
						loadEstimates();
					}}
				/>
			)}
		</div>
	);

	async function handleSend(id: string) {
		try {
			await fetch("/api/admin/estimates", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, status: "sent" }),
			});
			toast.success("Estimate sent!");
			loadEstimates();
		} catch {
			toast.error("Failed to send estimate");
		}
	}
}

// ── Create Estimate Modal ──────────────────────────────────────────

function CreateEstimateModal({
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: () => void;
}) {
	const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);
	const [templateType, setTemplateType] = useState<"estimate" | "proposal">(
		"estimate",
	);
	const [terms, setTerms] = useState("");
	const [proposalContent, setProposalContent] = useState("");
	const [validDays, setValidDays] = useState("30");
	const [submitting, setSubmitting] = useState(false);
	const [products, setProducts] = useState<StripeProductDetail[]>([]);
	const [showPicker, setShowPicker] = useState(false);

	// ── Manual line item state
	const [manualName, setManualName] = useState("");
	const [manualPrice, setManualPrice] = useState("");
	const [manualQty, setManualQty] = useState("1");
	const [manualInterval, setManualInterval] = useState("one_time");

	useEffect(() => {
		getStripeProducts().then((res) => {
			if (res.products) setProducts(res.products.filter((p) => p.active));
		});
	}, []);

	const totalCents = lineItems.reduce(
		(s, i) => s + i.unitPriceCents * i.quantity,
		0,
	);

	function addFromPriceBook(product: StripeProductDetail) {
		const price = product.default_price;
		setLineItems((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				stripeProductId: product.id,
				name: product.name,
				description: product.description ?? undefined,
				quantity: 1,
				unitPriceCents: price?.unit_amount ?? 0,
				interval: price?.recurring?.interval ?? "one_time",
			},
		]);
		setShowPicker(false);
	}

	function addManualItem() {
		if (!manualName || !manualPrice) return;
		setLineItems((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				name: manualName,
				quantity: parseInt(manualQty, 10) || 1,
				unitPriceCents: dollarsToCents(manualPrice),
				interval: manualInterval,
			},
		]);
		setManualName("");
		setManualPrice("");
		setManualQty("1");
	}

	function removeItem(id: string) {
		setLineItems((prev) => prev.filter((i) => i.id !== id));
	}

	async function handleSubmit() {
		if (lineItems.length === 0 && templateType === "estimate") {
			toast.error("Add at least one line item");
			return;
		}
		setSubmitting(true);
		try {
			const validUntil = new Date();
			validUntil.setDate(
				validUntil.getDate() + (parseInt(validDays, 10) || 30),
			);

			const res = await fetch("/api/admin/estimates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					templateType,
					lineItems,
					terms: terms || undefined,
					proposalContent: proposalContent || undefined,
					validUntil: validUntil.toISOString(),
				}),
			});
			if (!res.ok) throw new Error("Failed to create estimate");
			toast.success("Estimate created!");
			onCreated();
		} catch {
			toast.error("Failed to create estimate");
		}
		setSubmitting(false);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative bg-surface-0 border border-glass-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
				{/* Header */}
				<div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-glass-border px-6 py-4 flex items-center justify-between">
					<h2 className="text-lg font-bold text-white flex items-center gap-2">
						<FileText size={20} className="text-blue-400" />
						New Estimate
					</h2>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Type Toggle */}
					<div className="flex gap-2">
						{(["estimate", "proposal"] as const).map((t) => (
							<button
								key={t}
								onClick={() => setTemplateType(t)}
								className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
									templateType === t
										? "bg-(--color-brand)/10 border-(--color-brand) text-white"
										: "bg-surface-1 border-glass-border text-text-muted hover:border-white/20"
								}`}
							>
								{t === "estimate" ? "📋 Quick Estimate" : "📄 Full Proposal"}
							</button>
						))}
					</div>

					{/* Line Items */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold text-white">Line Items</h3>
							<button
								onClick={() => setShowPicker(!showPicker)}
								className="flex items-center gap-1.5 text-xs text-(--color-brand) hover:text-white transition-colors"
							>
								<Plus size={14} />
								From Price Book
							</button>
						</div>

						{/* PriceBook picker */}
						{showPicker && (
							<div className="rounded-lg border border-glass-border bg-surface-1 p-3 space-y-2 max-h-48 overflow-y-auto">
								{products.length === 0 ? (
									<p className="text-xs text-text-muted text-center py-4">
										No products in Price Book
									</p>
								) : (
									products.map((p) => (
										<button
											key={p.id}
											onClick={() => addFromPriceBook(p)}
											className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-surface-2 transition-colors"
										>
											<span className="text-sm text-white">{p.name}</span>
											<span className="text-xs text-text-muted">
												{p.default_price
													? formatCents(p.default_price.unit_amount)
													: "—"}
												{p.default_price?.recurring
													? `/${p.default_price.recurring.interval}`
													: ""}
											</span>
										</button>
									))
								)}
							</div>
						)}

						{/* Current line items */}
						{lineItems.length > 0 && (
							<div className="space-y-2">
								{lineItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 p-3 rounded-lg bg-surface-1 border border-glass-border group"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-white font-medium truncate">
												{item.name}
											</p>
											<p className="text-[11px] text-text-muted">
												{item.quantity} × {formatCents(item.unitPriceCents)}
												{item.interval !== "one_time"
													? ` / ${item.interval}`
													: ""}
											</p>
										</div>
										<span className="text-sm font-medium text-white">
											{formatCents(item.unitPriceCents * item.quantity)}
										</span>
										<button
											onClick={() => removeItem(item.id)}
											className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
										>
											<Trash2 size={14} />
										</button>
									</div>
								))}
							</div>
						)}

						{/* Manual add */}
						<div className="grid grid-cols-12 gap-2">
							<input
								type="text"
								placeholder="Item name"
								value={manualName}
								onChange={(e) => setManualName(e.target.value)}
								className="col-span-5 px-3 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand)"
							/>
							<input
								type="number"
								placeholder="$0.00"
								value={manualPrice}
								onChange={(e) => setManualPrice(e.target.value)}
								className="col-span-2 px-3 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-(--color-brand)"
								step="0.01"
								min="0"
							/>
							<input
								type="number"
								placeholder="Qty"
								value={manualQty}
								onChange={(e) => setManualQty(e.target.value)}
								className="col-span-1 px-2 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm text-center focus:outline-none focus:border-(--color-brand)"
								min="1"
							/>
							<select
								value={manualInterval}
								onChange={(e) => setManualInterval(e.target.value)}
								className="col-span-2 px-2 py-2 rounded-lg bg-surface-1 border border-glass-border text-white text-sm focus:outline-none focus:border-(--color-brand)"
							>
								<option value="one_time">One-time</option>
								<option value="month">Monthly</option>
								<option value="year">Yearly</option>
							</select>
							<button
								onClick={addManualItem}
								className="col-span-2 flex items-center justify-center gap-1 py-2 rounded-lg bg-(--color-brand)/10 border border-(--color-brand)/30 text-(--color-brand) text-sm hover:bg-(--color-brand)/20 transition-colors"
							>
								<Plus size={14} /> Add
							</button>
						</div>
					</div>

					{/* Total */}
					<div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10">
						<span className="text-sm text-text-muted">Estimated Total</span>
						<span className="text-2xl font-bold text-white flex items-center gap-1">
							<DollarSign size={20} className="text-blue-400" />
							{formatCents(totalCents)}
						</span>
					</div>

					{/* Proposal Content */}
					{templateType === "proposal" && (
						<div>
							<label className="block text-sm font-medium text-text-muted mb-2">
								Proposal Content
							</label>
							<textarea
								value={proposalContent}
								onChange={(e) => setProposalContent(e.target.value)}
								placeholder="Write your detailed proposal here..."
								rows={6}
								className="w-full px-4 py-3 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted resize-y focus:outline-none focus:border-(--color-brand)"
							/>
						</div>
					)}

					{/* Terms & Validity */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-text-muted mb-2">
								Terms & Conditions
							</label>
							<textarea
								value={terms}
								onChange={(e) => setTerms(e.target.value)}
								placeholder="Payment terms, warranty, etc."
								rows={3}
								className="w-full px-4 py-3 rounded-lg bg-surface-1 border border-glass-border text-white text-sm placeholder:text-text-muted resize-y focus:outline-none focus:border-(--color-brand)"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-text-muted mb-2">
								Valid For (days)
							</label>
							<input
								type="number"
								value={validDays}
								onChange={(e) => setValidDays(e.target.value)}
								className="w-full px-4 py-3 rounded-lg bg-surface-1 border border-glass-border text-white text-sm focus:outline-none focus:border-(--color-brand)"
								min="1"
							/>
						</div>
					</div>

					{/* Footer */}
					<div className="flex justify-end gap-3 pt-2">
						<button
							onClick={onClose}
							className="px-4 py-2.5 rounded-xl bg-surface-1 border border-glass-border text-text-muted text-sm hover:text-white transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={submitting}
							className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-(--color-brand) to-blue-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
						>
							{submitting ? "Creating..." : "Create Estimate"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
