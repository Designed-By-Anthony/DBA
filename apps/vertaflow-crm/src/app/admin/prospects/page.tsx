"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { dealSources, pipelineStages } from "@/lib/theme.config";
import type { Prospect, ProspectStatus } from "@/lib/types";
import {
	addProspect,
	bulkDeleteProspects,
	bulkUpdateStatus,
	deleteProspect,
	findDuplicateProspectByEmail,
	getProspects,
	updateProspect,
} from "../actions";

export default function ProspectsPage() {
	const [prospects, setProspects] = useState<Prospect[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);
	const [dupHint, setDupHint] = useState<{ id: string; name: string } | null>(
		null,
	);

	// Form state
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		company: "",
		website: "",
		targetUrl: "",
		dealValue: "",
		source: "",
		tags: "",
		notes: "",
		status: "lead" as ProspectStatus,
	});

	const loadProspects = useCallback(async () => {
		try {
			const data = await getProspects();
			setProspects(data);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to load prospects");
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		queueMicrotask(() => void loadProspects());
	}, [loadProspects]);

	useEffect(() => {
		const email = form.email.trim();
		if (!email || !showAdd) {
			const clearHint = window.setTimeout(() => setDupHint(null), 0);
			return () => clearTimeout(clearHint);
		}
		const t = window.setTimeout(() => {
			void findDuplicateProspectByEmail(email).then((d) => setDupHint(d));
		}, 450);
		return () => clearTimeout(t);
	}, [form.email, showAdd]);

	const filtered = prospects.filter((p) => {
		const q = search.toLowerCase();
		return (
			p.name.toLowerCase().includes(q) ||
			p.email.toLowerCase().includes(q) ||
			p.company.toLowerCase().includes(q) ||
			p.tags.some((t) => t.toLowerCase().includes(q))
		);
	});

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.name || !form.email) return;
		setSaving(true);
		try {
			const res = await addProspect({
				name: form.name,
				email: form.email,
				phone: form.phone,
				company: form.company,
				website: form.website,
				targetUrl: form.targetUrl,
				dealValue: parseFloat(form.dealValue) || 0,
				source: form.source,
				tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
				notes: form.notes,
				status: form.status,
			});
			if (!res.success) {
				if (res.error === "duplicate_email") {
					toast.error("That email is already a prospect.", {
						description: `Open the existing record to merge duplicates if it’s the same person.`,
						action: {
							label: "Open record",
							onClick: () => {
								window.location.href = `/admin/prospects/${res.duplicateOfId}`;
							},
						},
					});
				}
				setSaving(false);
				return;
			}
			setForm({
				name: "",
				email: "",
				phone: "",
				company: "",
				website: "",
				targetUrl: "",
				dealValue: "",
				source: "",
				tags: "",
				notes: "",
				status: "lead",
			});
			setShowAdd(false);
			await loadProspects();
		} catch {
			toast.error("Failed to add prospect");
		}
		setSaving(false);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this prospect?")) return;
		await deleteProspect(id);
		await loadProspects();
	};

	const handleBulkDelete = async () => {
		if (!confirm(`Delete ${selected.size} prospects?`)) return;
		await bulkDeleteProspects(Array.from(selected));
		setSelected(new Set());
		await loadProspects();
	};

	const handleBulkStatus = async (status: ProspectStatus) => {
		await bulkUpdateStatus(Array.from(selected), status);
		setSelected(new Set());
		await loadProspects();
	};

	const toggleSelect = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleAll = () => {
		if (selected.size === filtered.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(filtered.map((p) => p.id)));
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
				<div>
					<h1 className="text-xl font-bold text-white">Prospects</h1>
					<p className="text-xs text-text-muted">
						{prospects.length} total · {filtered.length} shown
					</p>
				</div>
				<button
					onClick={() => setShowAdd(!showAdd)}
					className="px-4 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors shadow-(--color-brand-glow)"
				>
					{showAdd ? "Cancel" : "+ Add Prospect"}
				</button>
			</div>

			{/* Add Prospect Form */}
			{showAdd && (
				<form
					onSubmit={handleAdd}
					className="rounded-xl border border-glass-border bg-glass-bg p-6 space-y-4 backdrop-blur-sm"
					style={{ animation: "fade-up 0.2s ease-out" }}
				>
					<h3 className="text-sm font-semibold text-white">Add New Prospect</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Name *
							</label>
							<input
								required
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								placeholder="John Smith"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Email *
							</label>
							<input
								required
								type="email"
								value={form.email}
								onChange={(e) => setForm({ ...form, email: e.target.value })}
								placeholder="john@business.com"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
							{dupHint && (
								<p className="text-[11px] text-amber-400 mt-1">
									Possible duplicate:{" "}
									<Link
										href={`/admin/prospects/${dupHint.id}`}
										className="underline hover:text-amber-300"
									>
										{dupHint.name || dupHint.id}
									</Link>
								</p>
							)}
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Phone
							</label>
							<input
								value={form.phone}
								onChange={(e) => setForm({ ...form, phone: e.target.value })}
								placeholder="(315) 555-0123"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Company
							</label>
							<input
								value={form.company}
								onChange={(e) => setForm({ ...form, company: e.target.value })}
								placeholder="Smith's Plumbing LLC"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Website
							</label>
							<input
								value={form.website}
								onChange={(e) => setForm({ ...form, website: e.target.value })}
								placeholder="smithsplumbing.com"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Deal Value ($)
							</label>
							<input
								type="number"
								value={form.dealValue}
								onChange={(e) =>
									setForm({ ...form, dealValue: e.target.value })
								}
								placeholder="2500"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Source
							</label>
							<select
								value={form.source}
								onChange={(e) => setForm({ ...form, source: e.target.value })}
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							>
								<option value="">Select source...</option>
								{dealSources.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Stage
							</label>
							<select
								value={form.status}
								onChange={(e) =>
									setForm({ ...form, status: e.target.value as ProspectStatus })
								}
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							>
								{pipelineStages.map((s) => (
									<option key={s.id} value={s.id}>
										{s.label}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
								Tags (comma-separated)
							</label>
							<input
								value={form.tags}
								onChange={(e) => setForm({ ...form, tags: e.target.value })}
								placeholder="VIP, Hot Lead"
								className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
							/>
						</div>
					</div>
					<div>
						<label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
							Notes
						</label>
						<textarea
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
							rows={2}
							placeholder="Any notes about this prospect..."
							className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
						/>
					</div>
					<button
						type="submit"
						disabled={saving}
						className="px-6 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-(--color-brand-glow)"
					>
						{saving ? "Saving..." : "Add Prospect"}
					</button>
				</form>
			)}

			{/* Search + Bulk Actions */}
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by name, email, company, or tags..."
					className="flex-1 bg-surface-1 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-(--color-brand) transition-colors w-full sm:max-w-md"
				/>
				{selected.size > 0 && (
					<div
						className="flex gap-2 items-center flex-wrap"
						style={{ animation: "fade-up 0.15s ease-out" }}
					>
						<span className="text-xs text-text-muted">
							{selected.size} selected
						</span>
						<select
							onChange={(e) => {
								if (e.target.value)
									handleBulkStatus(e.target.value as ProspectStatus);
								e.target.value = "";
							}}
							className="bg-surface-2 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-white"
						>
							<option value="">Move to...</option>
							{pipelineStages.map((s) => (
								<option key={s.id} value={s.id}>
									{s.label}
								</option>
							))}
						</select>
						<button
							onClick={handleBulkDelete}
							className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors border border-red-500/20"
						>
							Delete
						</button>
					</div>
				)}
			</div>

			{/* Table */}
			<div className="rounded-xl border border-glass-border bg-glass-bg overflow-x-auto backdrop-blur-sm">
				{loading ? (
					<div className="p-12 text-center text-text-muted">Loading...</div>
				) : filtered.length === 0 ? (
					<div className="p-12 text-center">
						<p className="text-lg mb-2">👥</p>
						<p className="text-sm text-text-muted">
							{search
								? "No prospects match your search"
								: "No prospects yet — add your first one above!"}
						</p>
					</div>
				) : (
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-glass-border">
								<th className="px-4 py-3 w-10">
									<input
										type="checkbox"
										checked={
											selected.size === filtered.length && filtered.length > 0
										}
										onChange={toggleAll}
										className="accent-(--color-brand)"
									/>
								</th>
								<th className="px-4 py-3 text-xs text-text-muted uppercase tracking-wider font-medium">
									Name
								</th>
								<th className="px-4 py-3 text-xs text-text-muted uppercase tracking-wider font-medium hidden md:table-cell">
									Email
								</th>
								<th className="px-4 py-3 text-xs text-text-muted uppercase tracking-wider font-medium hidden lg:table-cell">
									Company
								</th>
								<th className="px-4 py-3 text-xs text-text-muted uppercase tracking-wider font-medium">
									Status
								</th>
								<th className="px-4 py-3 text-xs text-text-muted uppercase tracking-wider font-medium hidden lg:table-cell">
									Value
								</th>
								<th className="px-4 py-3 text-xs text-text-muted uppercase tracking-wider font-medium hidden xl:table-cell">
									Source
								</th>
								<th className="px-4 py-3 w-20"></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-glass-border">
							{filtered.map((p) => (
								<tr
									key={p.id}
									className={`hover:bg-surface-3 transition-colors ${
										selected.has(p.id) ? "bg-brand-subtle" : ""
									}`}
								>
									<td className="px-4 py-3">
										<input
											type="checkbox"
											checked={selected.has(p.id)}
											onChange={() => toggleSelect(p.id)}
											className="accent-(--color-brand)"
										/>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-brand-subtle flex items-center justify-center text-white text-xs font-bold shrink-0">
												{p.name?.charAt(0)?.toUpperCase()}
											</div>
											<div className="min-w-0">
												<Link
													href={`/admin/prospects/${p.id}`}
													className="text-white font-medium truncate hover:text-(--color-brand) transition-colors block"
												>
													{p.name}
												</Link>
												{p.phone && (
													<p className="text-xs text-text-muted truncate">
														{p.phone}
													</p>
												)}
											</div>
										</div>
									</td>
									<td className="px-4 py-3 text-text-gray hidden md:table-cell">
										<span className="truncate block max-w-[200px]">
											{p.email}
										</span>
									</td>
									<td className="px-4 py-3 text-text-gray hidden lg:table-cell truncate">
										{p.company}
									</td>
									<td className="px-4 py-3">
										<select
											value={p.status}
											onChange={async (e) => {
												const newStatus = e.target.value as ProspectStatus;
												setProspects((prev) =>
													prev.map((x) =>
														x.id === p.id ? { ...x, status: newStatus } : x,
													),
												);
												await updateProspect(p.id, { status: newStatus });
											}}
											className="bg-transparent text-xs border border-glass-border rounded px-2 py-1 text-white outline-none cursor-pointer"
										>
											{pipelineStages.map((s) => (
												<option
													key={s.id}
													value={s.id}
													className="bg-surface-1"
												>
													{s.label}
												</option>
											))}
										</select>
									</td>
									<td className="px-4 py-3 text-text-gray hidden lg:table-cell">
										{p.dealValue ? `$${p.dealValue.toLocaleString()}` : "—"}
									</td>
									<td className="px-4 py-3 text-xs text-text-muted hidden xl:table-cell">
										{p.source || "—"}
									</td>
									<td className="px-4 py-3">
										<button
											onClick={() => handleDelete(p.id)}
											className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
											title="Delete"
										>
											×
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
