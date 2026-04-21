"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	cachePortalTickets,
	flushQueuedPortalTickets,
	getActivePortalCacheKey,
	getCachedPortalTickets,
	getPendingPortalTicketCount,
	queuePortalTicket,
	type PortalTicketThread,
} from "@/lib/offline/portal-offline";

const statusColors: Record<string, string> = {
	open: "bg-amber-500/10 text-amber-400",
	in_progress: "bg-blue-500/10 text-blue-400",
	resolved: "bg-emerald-500/10 text-emerald-400",
	queued: "bg-sky-500/10 text-sky-300",
	closed: "bg-white/5 text-[var(--color-text-muted)]",
};

export default function PortalTicketsPage() {
	const router = useRouter();
	const [tickets, setTickets] = useState<PortalTicketThread[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<PortalTicketThread | null>(null);
	const [cacheKey, setCacheKey] = useState<string | null>(null);
	const [offlineNotice, setOfflineNotice] = useState("");
	const [queuedTicketCount, setQueuedTicketCount] = useState(0);
	const [subject, setSubject] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [success, setSuccess] = useState("");

	const refreshQueuedTicketCount = useCallback(async (resolvedKey?: string | null) => {
		const key = resolvedKey ?? cacheKey ?? (await getActivePortalCacheKey());
		if (!key) {
			setQueuedTicketCount(0);
			return;
		}
		setQueuedTicketCount(await getPendingPortalTicketCount(key));
	}, [cacheKey]);

	const load = useCallback(async () => {
		try {
			const res = await fetch("/api/portal/tickets", { cache: "no-store" });
			if (res.status === 401) {
				router.push("/portal");
				return;
			}
			if (!res.ok) {
				throw new Error(`portal-tickets-${res.status}`);
			}

			const payload = (await res.json()) as {
				offlineCacheKey?: string;
				tickets?: PortalTicketThread[];
			};
			const nextCacheKey =
				payload.offlineCacheKey ?? cacheKey ?? (await getActivePortalCacheKey());
			const nextTickets = payload.tickets || [];

			setTickets(nextTickets);
			setSelected((current) =>
				current
					? nextTickets.find((ticket) => ticket.id === current.id) ?? null
					: null,
			);
			setCacheKey(nextCacheKey);
			setOfflineNotice("");
			if (nextCacheKey) {
				await cachePortalTickets(nextCacheKey, nextTickets);
				await refreshQueuedTicketCount(nextCacheKey);
				const flushed = await flushQueuedPortalTickets(nextCacheKey);
				if (flushed.sent > 0) {
					const refresh = await fetch("/api/portal/tickets", {
						cache: "no-store",
					});
					if (refresh.ok) {
						const refreshedPayload = (await refresh.json()) as {
							offlineCacheKey?: string;
							tickets?: PortalTicketThread[];
						};
						const refreshedTickets = refreshedPayload.tickets || [];
						setTickets(refreshedTickets);
						setSelected((current) =>
							current
								? refreshedTickets.find((ticket) => ticket.id === current.id) ??
										null
								: null,
						);
						await cachePortalTickets(nextCacheKey, refreshedTickets);
					}
					await refreshQueuedTicketCount(nextCacheKey);
					setOfflineNotice(
						`${flushed.sent} queued support ticket${flushed.sent === 1 ? "" : "s"} sent after reconnecting.`,
					);
				}
			}
		} catch {
			const resolvedKey = cacheKey ?? (await getActivePortalCacheKey());
			const cachedTickets = await getCachedPortalTickets(resolvedKey);
			if (cachedTickets.length > 0) {
				setTickets(cachedTickets);
				setSelected((current) =>
					current
						? cachedTickets.find((ticket) => ticket.id === current.id) ?? null
						: null,
				);
				setCacheKey(resolvedKey);
				setOfflineNotice(
					"Offline mode: showing saved support history from this device.",
				);
				await refreshQueuedTicketCount(resolvedKey);
			} else {
				setOfflineNotice(
					"Support history will appear offline after this device completes its first sync.",
				);
			}
		} finally {
			setLoading(false);
		}
	}, [cacheKey, refreshQueuedTicketCount, router]);

	useEffect(() => {
		queueMicrotask(() => void load());
	}, [load]);

	useEffect(() => {
		const handleOnline = () => {
			void load();
		};

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [load]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!subject.trim()) return;
		setSubmitting(true);
		const trimmedSubject = subject.trim();
		const trimmedDescription = description.trim();
		try {
			const res = await fetch("/api/portal/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subject: trimmedSubject,
					description: trimmedDescription,
				}),
			});
			if (!res.ok) {
				throw new Error(`portal-ticket-${res.status}`);
			}

			setSubject("");
			setDescription("");
			setShowForm(false);
			setSuccess("Ticket submitted! We'll be in touch soon.");
			setTimeout(() => setSuccess(""), 5000);
			await load();
		} catch {
			const resolvedKey = cacheKey ?? (await getActivePortalCacheKey());
			if (!resolvedKey) {
				setOfflineNotice(
					"Offline queueing turns on after this device completes one successful sync.",
				);
				return;
			}

			const queuedTicket = await queuePortalTicket(resolvedKey, {
				subject: trimmedSubject,
				description: trimmedDescription,
			});
			setTickets((current) => {
				const nextTickets = [queuedTicket, ...current];
				void cachePortalTickets(resolvedKey, nextTickets);
				return nextTickets;
			});
			setSelected(queuedTicket);
			setSubject("");
			setDescription("");
			setShowForm(false);
			setSuccess("Ticket saved offline. It will send when you reconnect.");
			setTimeout(() => setSuccess(""), 5000);
			await refreshQueuedTicketCount(resolvedKey);
		} finally {
			setSubmitting(false);
		}
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

			{(offlineNotice || queuedTicketCount > 0) && (
				<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
					<p>{offlineNotice || "Offline support queue active on this device."}</p>
					{queuedTicketCount > 0 && (
						<p className="mt-1 text-xs text-amber-200/90">
							{queuedTicketCount} pending ticket
							{queuedTicketCount === 1 ? "" : "s"} waiting to sync.
						</p>
					)}
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
