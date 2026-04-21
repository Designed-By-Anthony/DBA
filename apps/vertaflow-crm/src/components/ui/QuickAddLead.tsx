"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addProspect, findDuplicateProspectByEmail } from "@/app/admin/actions";

export default function QuickAddLead() {
	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		company: "",
		website: "",
		dealValue: "",
		source: "",
		notes: "",
	});

	const update = (key: string, value: string) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const [dupHint, setDupHint] = useState<{ id: string; name: string } | null>(
		null,
	);

	useEffect(() => {
		const email = form.email.trim();
		if (!email || !open) {
			const clearHint = window.setTimeout(() => setDupHint(null), 0);
			return () => clearTimeout(clearHint);
		}
		const t = window.setTimeout(() => {
			void findDuplicateProspectByEmail(email).then((d) => setDupHint(d));
		}, 450);
		return () => clearTimeout(t);
	}, [form.email, open]);

	const handleSubmit = async () => {
		if (!form.name.trim() || !form.email.trim()) return;
		setSaving(true);

		const res = await addProspect({
			name: form.name.trim(),
			email: form.email.trim(),
			phone: form.phone.trim(),
			company: form.company.trim(),
			website: form.website.trim(),
			dealValue: parseFloat(form.dealValue) || 0,
			source: form.source.trim() || "Manual Entry",
			notes: form.notes.trim(),
		});

		if (!res.success) {
			if (res.error === "duplicate_email") {
				toast.error("That email already exists.", {
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

		// Reset
		setForm({
			name: "",
			email: "",
			phone: "",
			company: "",
			website: "",
			dealValue: "",
			source: "",
			notes: "",
		});
		setSaving(false);
		setOpen(false);
		// Reload page to show new lead
		window.location.reload();
	};

	return (
		<>
			{/* Floating Action Button */}
			<button
				onClick={() => setOpen(true)}
				className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-(--color-brand) hover:bg-brand-hover text-white shadow-(--color-brand-glow) flex items-center justify-center transition-all hover:scale-110 active:scale-95"
				title="Quick Add Lead"
			>
				<Plus size={24} />
			</button>

			{/* Modal Overlay */}
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/70 backdrop-blur-md"
						onClick={() => setOpen(false)}
					/>

					{/* Modal */}
					<div className="relative w-full max-w-lg bg-[#0d0e14]/95 backdrop-blur-xl border border-glass-border rounded-2xl shadow-[0_0_80px_rgba(37,99,235,0.08),0_24px_48px_rgba(0,0,0,0.6)] animate-scale-in overflow-hidden">
						{/* Header */}
						<div className="px-6 py-4 border-b border-glass-border bg-gradient-to-r from-surface-2/80 to-transparent flex items-center justify-between">
							<div>
								<h2 className="text-base font-semibold text-white">
									Quick Add Lead
								</h2>
								<p className="text-[11px] text-text-muted mt-0.5">
									Add a new prospect to your pipeline
								</p>
							</div>
							<button
								onClick={() => setOpen(false)}
								className="p-1.5 rounded-lg text-text-gray hover:text-white hover:bg-surface-3 transition-colors"
							>
								<X size={18} />
							</button>
						</div>

						{/* Form */}
						<div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs text-text-muted mb-1">
										Name *
									</label>
									<input
										value={form.name}
										onChange={(e) => update("name", e.target.value)}
										placeholder="John Smith"
										className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
									/>
								</div>
								<div>
									<label className="block text-xs text-text-muted mb-1">
										Email *
									</label>
									<input
										value={form.email}
										onChange={(e) => update("email", e.target.value)}
										placeholder="john@example.com"
										type="email"
										className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
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
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs text-text-muted mb-1">
										Phone
									</label>
									<input
										value={form.phone}
										onChange={(e) => update("phone", e.target.value)}
										placeholder="(555) 123-4567"
										className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
									/>
								</div>
								<div>
									<label className="block text-xs text-text-muted mb-1">
										Company
									</label>
									<input
										value={form.company}
										onChange={(e) => update("company", e.target.value)}
										placeholder="Acme Corp"
										className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs text-text-muted mb-1">
										Website
									</label>
									<input
										value={form.website}
										onChange={(e) => update("website", e.target.value)}
										placeholder="https://example.com"
										className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
									/>
								</div>
								<div>
									<label className="block text-xs text-text-muted mb-1">
										Deal Value ($)
									</label>
									<input
										value={form.dealValue}
										onChange={(e) => update("dealValue", e.target.value)}
										placeholder="5000"
										type="number"
										className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs text-text-muted mb-1">
									Source
								</label>
								<select
									value={form.source}
									onChange={(e) => update("source", e.target.value)}
									className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all"
								>
									<option value="">Select source...</option>
									<option value="Referral">Referral</option>
									<option value="Website Form">Website Form</option>
									<option value="Cold Outreach">Cold Outreach</option>
									<option value="Social Media">Social Media</option>
									<option value="Networking Event">Networking Event</option>
									<option value="Audit Tool">Audit Tool</option>
									<option value="Other">Other</option>
								</select>
							</div>

							<div>
								<label className="block text-xs text-text-muted mb-1">
									Notes
								</label>
								<textarea
									value={form.notes}
									onChange={(e) => update("notes", e.target.value)}
									rows={3}
									placeholder="Initial conversation details..."
									className="w-full bg-surface-0/60 border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-text-gray/50 outline-none focus:border-(--color-brand) focus:ring-1 focus:ring-(--color-brand)/30 transition-all resize-none"
								/>
							</div>
						</div>

						{/* Footer */}
						<div className="px-6 py-4 border-t border-glass-border bg-surface-0/30 flex justify-end gap-3">
							<button
								onClick={() => setOpen(false)}
								className="px-4 py-2.5 rounded-lg text-sm text-text-gray hover:text-white hover:bg-surface-3 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={saving || !form.name.trim() || !form.email.trim()}
								className="px-6 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-(--color-brand-glow)"
							>
								{saving ? "Creating..." : "Create Lead"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
