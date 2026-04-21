"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Ticket {
	id: string;
	subject: string;
	description: string;
	status: string;
	priority: string;
	adminReply: string | null;
	messages: Array<{
		id: string;
		from: string;
		content: string;
		createdAt: string;
	}>;
	createdAt: string;
}

const statusColors: Record<string, string> = {
	open: "bg-amber-500/10 text-amber-400",
	in_progress: "bg-blue-500/10 text-blue-400",
	resolved: "bg-emerald-500/10 text-emerald-400",
	closed: "bg-white/5 text-[var(--color-text-muted)]",
};

export default function PortalTicketsPage() {
	const router = useRouter();
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<Ticket | null>(null);
	const [subject, setSubject] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [success, setSuccess] = useState("");

	const load = useCallback(async () => {
		const res = await fetch("/api/portal/tickets");
		if (res.status === 401) {
			router.push("/portal");
			return;
		}
		if (res.ok) {
			const data = await res.json();
			setTickets(data.tickets || []);
		}
		setLoading(false);
	}, [router]);

	useEffect(() => {
		queueMicrotask(() => void load());
	}, [load]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!subject.trim()) return;
		setSubmitting(true);
		const res = await fetch("/api/portal/tickets", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				subject: subject.trim(),
				description: description.trim(),
			}),
		});
		if (res.ok) {
			setSubject("");
			setDescription("");
			setShowForm(false);
			setSuccess("Ticket submitted! We'll be in touch soon.");
			setTimeout(() => setSuccess(""), 5000);
			await load();
		}
		setSubmitting(false);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-white">Support</h1>
					<p className="text-sm text-text-muted mt-1">
						Questions about your project? Submit a ticket.
					</p>
				</div>
				<button
					onClick={() => setShowForm((p) => !p)}
					className="px-4 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors shadow-(--color-brand-glow)"
				>
					+ New Ticket
				</button>
			</div>

			{/* Success toast */}
			{success && (
				<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
					✅ {success}
				</div>
			)}

			{/* New ticket form */}
			{showForm && (
				<div className="rounded-xl border-(--color-brand)/40 bg-glass-bg p-5 backdrop-blur-sm">
					<h2 className="text-sm font-semibold text-white mb-4">
						Submit a Support Ticket
					</h2>
					<form onSubmit={handleSubmit} className="space-y-3">
						<input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Subject — what do you need help with?"
							required
							className="w-full bg-surface-1 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand) transition-colors"
						/>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe your issue or question in detail..."
							rows={4}
							className="w-full bg-surface-1 border border-glass-border rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-(--color-brand) transition-colors resize-none"
						/>
						<div className="flex gap-3">
							<button
								type="submit"
								disabled={!subject.trim() || submitting}
								className="flex-1 py-2.5 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
							>
								{submitting ? "Submitting..." : "Submit Ticket"}
							</button>
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="px-4 py-2.5 rounded-lg bg-surface-2 text-text-muted hover:text-white text-sm transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Ticket list + detail */}
			{loading ? (
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
					))}
				</div>
			) : tickets.length === 0 ? (
				<div className="rounded-xl border border-glass-border bg-glass-bg p-12 text-center">
					<p className="text-4xl mb-3">🎫</p>
					<p className="text-white font-medium mb-1">No tickets yet</p>
					<p className="text-sm text-text-muted">
						Have a question or issue? Submit a ticket above.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
					{/* List */}
					<div className="md:col-span-2 space-y-2">
						{tickets.map((t) => (
							<button
								key={t.id}
								onClick={() => setSelected(t)}
								className={`w-full text-left rounded-xl border p-4 transition-all ${
									selected?.id === t.id
										? "border-(--color-brand) bg-brand-subtle"
										: "border-glass-border bg-glass-bg hover:border-(--color-brand)/40"
								}`}
							>
								<div className="flex items-center justify-between mb-1">
									<p className="text-sm font-medium text-white line-clamp-1">
										{t.subject}
									</p>
									<span
										className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[t.status]}`}
									>
										{t.status.replace("_", " ")}
									</span>
								</div>
								<p className="text-xs text-text-muted">
									{new Date(t.createdAt).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</p>
							</button>
						))}
					</div>

					{/* Thread view */}
					<div className="md:col-span-3">
						{!selected ? (
							<div className="rounded-xl border border-glass-border bg-glass-bg p-8 text-center h-full flex flex-col items-center justify-center">
								<p className="text-3xl mb-2">💬</p>
								<p className="text-sm text-text-muted">
									Select a ticket to view the conversation
								</p>
							</div>
						) : (
							<div className="rounded-xl border border-glass-border bg-glass-bg overflow-hidden">
								<div className="px-5 py-4 border-b border-glass-border">
									<h2 className="text-sm font-semibold text-white">
										{selected.subject}
									</h2>
									<div className="flex items-center gap-2 mt-1">
										<span
											className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[selected.status]}`}
										>
											{selected.status.replace("_", " ")}
										</span>
										<span className="text-[10px] text-text-muted">
											{new Date(selected.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>

								<div className="p-5 space-y-4 max-h-72 overflow-y-auto">
									{selected.messages.map((msg) => (
										<div
											key={msg.id}
											className={`flex gap-3 ${msg.from === "admin" ? "flex-row-reverse" : ""}`}
										>
											<div
												className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
													msg.from === "admin"
														? "bg-(--color-brand)"
														: "bg-surface-3"
												} text-white`}
											>
												{msg.from === "admin" ? "A" : "Me"}
											</div>
											<div
												className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
													msg.from === "admin"
														? "bg-brand-subtle text-white"
														: "bg-surface-2 text-text-gray"
												}`}
											>
												<p className="text-sm">{msg.content}</p>
												<p className="text-[10px] opacity-50 mt-1">
													{new Date(msg.createdAt).toLocaleString("en-US", {
														month: "short",
														day: "numeric",
														hour: "numeric",
														minute: "2-digit",
													})}
												</p>
											</div>
										</div>
									))}
									{tickets.find((t) => t.id === selected.id)?.status ===
										"resolved" && (
										<div className="text-center py-3">
											<span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
												✅ Ticket resolved
											</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Back link */}
			<div className="pt-2">
				<Link
					href="/portal/dashboard"
					className="text-sm text-text-muted hover:text-white transition-colors"
				>
					← Back to Dashboard
				</Link>
			</div>
		</div>
	);
}
