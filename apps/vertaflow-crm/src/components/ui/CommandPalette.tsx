"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	ArrowRight,
	CornerDownLeft,
	FileText,
	Loader2,
	Search,
	Settings,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchOmni } from "@/app/admin/actions";

export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<
		{ id: string; name: string; email: string; company: string }[]
	>([]);
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	// Keyboard listener for Cmd+K
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
			if (e.key === "Escape") {
				setOpen(false);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	// Autofocus when opened
	useEffect(() => {
		if (open) {
			queueMicrotask(() => inputRef.current?.focus());
		} else {
			queueMicrotask(() => {
				setQuery("");
				setResults([]);
			});
		}
	}, [open]);

	// Debounced Search
	useEffect(() => {
		if (!query || query.length < 2) {
			queueMicrotask(() => setResults([]));
			return;
		}

		// Ignore static commands for db search
		if (query.startsWith(">")) return;

		queueMicrotask(() => setLoading(true));
		const timer = setTimeout(async () => {
			const data = await searchOmni(query);
			setResults(data);
			setLoading(false);
		}, 400);

		return () => clearTimeout(timer);
	}, [query]);

	const handleSelectProspect = (id: string) => {
		router.push(`/admin/prospects/${id}`);
		setOpen(false);
	};

	const handleCommand = (href: string) => {
		router.push(href);
		setOpen(false);
	};

	if (!open) return null;

	const staticCommands = [
		{
			label: "New Automation Rule",
			href: "/admin/automations",
			icon: Activity,
		},
		{ label: "Compose Email", href: "/admin/email", icon: FileText },
		{ label: "View User Access", href: "/admin/settings", icon: Settings },
	];

	const filteredCommands = staticCommands.filter((c) =>
		c.label.toLowerCase().includes(query.replace(">", "").trim().toLowerCase()),
	);

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
				{/* Backdrop */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={() => setOpen(false)}
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				/>

				{/* Palette Modal */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: -20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 10 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="relative w-full max-w-xl bg-(--color-surface-0) border border-glass-border shadow-2xl rounded-xl overflow-hidden flex flex-col mx-4"
				>
					{/* Top Search Input */}
					<div className="flex items-center px-4 py-3 border-b border-glass-border bg-surface-1">
						<Search className="text-text-muted w-5 h-5 mr-3 shrink-0" />
						<input
							ref={inputRef}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search prospects or type '>' for commands..."
							className="flex-1 bg-transparent outline-none text-white placeholder-text-muted text-sm"
						/>
						{loading && (
							<Loader2 className="w-4 h-4 text-(--color-brand) animate-spin shrink-0" />
						)}
						<span className="text-[10px] uppercase font-bold tracking-widest text-text-muted bg-surface-2 px-2 py-1 rounded ml-2">
							ESC
						</span>
					</div>

					<div className="max-h-[60vh] overflow-y-auto w-full p-2 workspace-scroll">
						{/* Command Modes */}
						{(query.startsWith(">") || query === "") && (
							<div className="mb-2">
								<p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
									Actions & Navigation
								</p>
								{filteredCommands.map((cmd) => (
									<button
										key={cmd.label}
										onClick={() => handleCommand(cmd.href)}
										className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-gray hover:text-white hover:bg-surface-2 rounded-lg transition-colors group"
									>
										<div className="flex items-center gap-3">
											<cmd.icon
												size={15}
												className="text-text-muted group-hover:text-(--color-brand)"
											/>
											{cmd.label}
										</div>
										<CornerDownLeft
											size={12}
											className="opacity-0 group-hover:opacity-100 transition-opacity"
										/>
									</button>
								))}
							</div>
						)}

						{/* Omni Search Results */}
						{query.length >= 2 && !query.startsWith(">") && (
							<div>
								<p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
									Prospects & Clients
								</p>

								{results.length === 0 && !loading && (
									<div className="px-4 py-8 text-center text-sm text-text-muted">
										No matching prospects found for &quot;{query}&quot;.
									</div>
								)}

								{results.map((prospect) => (
									<button
										key={prospect.id}
										onClick={() => handleSelectProspect(prospect.id)}
										className="w-full flex justify-between items-center px-3 py-2.5 text-left hover:bg-surface-2 rounded-lg transition-colors group"
									>
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-7 h-7 rounded-full bg-brand-subtle flex items-center justify-center shrink-0">
												<User size={12} className="text-(--color-brand)" />
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium text-white truncate">
													{prospect.name}
												</p>
												<p className="text-xs text-text-muted truncate">
													{prospect.email}
												</p>
											</div>
										</div>
										<ArrowRight
											size={14}
											className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4"
										/>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="bg-surface-1 border-t border-glass-border px-4 py-2 flex items-center justify-between">
						<div className="flex items-center gap-4 text-[10px] text-text-muted">
							<span className="flex items-center gap-1">
								<kbd className="bg-surface-2 px-1.5 rounded font-mono border border-glass-border">
									↑↓
								</kbd>{" "}
								to navigate
							</span>
							<span className="flex items-center gap-1">
								<kbd className="bg-surface-2 px-1.5 rounded font-mono border border-glass-border">
									↵
								</kbd>{" "}
								to open
							</span>
						</div>
						<p className="text-[10px] text-(--color-brand) font-semibold tracking-wider">
							AGENCY OS
						</p>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
