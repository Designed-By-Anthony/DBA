"use client";

import { useEffect, useState } from "react";

/** Fixed reference time so mock ticket ages are stable across renders (React purity). */
const KDS_MOCK_BASE_MS = 1_700_000_000_000;

// Mock ticket logic for the KDS
interface KDSTicket {
	id: string;
	orderNumber: string;
	source: "online" | "dine-in" | "kiosk";
	status: "new" | "cooking" | "ready";
	items: { id: string; name: string; qty: number; mods?: string[] }[];
	createdAt: number; // timestamp
}

export default function KitchenDisplaySystem() {
	const [tickets, setTickets] = useState<KDSTicket[]>([
		{
			id: "tkt-1",
			orderNumber: "802",
			source: "online",
			status: "new",
			createdAt: KDS_MOCK_BASE_MS - 1000 * 60 * 5, // 5 mins ago
			items: [
				{
					id: "1",
					name: "Artisan Burger",
					qty: 2,
					mods: ["No Onions", "Medium Rare"],
				},
				{ id: "2", name: "Truffle Fries", qty: 1 },
			],
		},
		{
			id: "tkt-2",
			orderNumber: "803",
			source: "dine-in",
			status: "cooking",
			createdAt: KDS_MOCK_BASE_MS - 1000 * 60 * 12, // 12 mins ago
			items: [
				{ id: "3", name: "Caesar Salad", qty: 1, mods: ["Dressing on side"] },
			],
		},
	]);

	const [currentTime, setCurrentTime] = useState(() => Date.now());

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(Date.now()), 10000); // refresh every 10s
		return () => clearInterval(timer);
	}, []);

	const getTicketColor = (createdAt: number) => {
		const elapsedMins = (currentTime - createdAt) / (1000 * 60);
		if (elapsedMins > 15)
			return "border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
		if (elapsedMins > 8) return "border-amber-500 bg-amber-500/10";
		return "border-emerald-500 bg-emerald-500/5";
	};

	const getElapsedTimeString = (createdAt: number) => {
		const elapsedMins = Math.floor((currentTime - createdAt) / (1000 * 60));
		return `${elapsedMins}m`;
	};

	const updateTicketStatus = (
		id: string,
		newStatus: "new" | "cooking" | "ready",
	) => {
		if (newStatus === "ready") {
			// Remove from KDS when ready
			setTickets((prev) => prev.filter((t) => t.id !== id));
			return;
		}
		setTickets((prev) =>
			prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
		);
	};

	return (
		<div className="h-screen bg-black flex flex-col p-4 overflow-hidden select-none">
			<header className="flex justify-between items-center bg-surface-1 border border-glass-border rounded-xl p-4 mb-4">
				<div>
					<h1 className="text-xl font-bold text-white tracking-widest uppercase">
						Expediter KDS
					</h1>
					<p className="text-xs text-text-muted">Live Order Routing</p>
				</div>
				<div className="flex gap-4">
					<div className="px-4 py-2 bg-surface-2 rounded-lg border border-glass-border text-sm text-text-muted">
						Network:{" "}
						<span className="text-emerald-400 font-bold ml-1">Online</span>
					</div>
					<button className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-bold hover:bg-red-500/30 transition-colors uppercase text-sm tracking-wider">
						86 Inventory Manager
					</button>
				</div>
			</header>

			<main className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
				{tickets.length === 0 && (
					<div className="w-full flex items-center justify-center border-2 border-dashed border-glass-border rounded-2xl text-text-muted text-xl font-medium tracking-wider">
						BOARD CLEAR
					</div>
				)}

				{tickets.map((ticket) => (
					<div
						key={ticket.id}
						className={`min-w-[300px] w-[300px] snap-start flex flex-col border-t-4 bg-surface-1 rounded-xl overflow-hidden shadow-2xl transition-all ${getTicketColor(ticket.createdAt)}`}
					>
						{/* Ticket Header */}
						<div className="px-4 py-3 border-b border-glass-border flex justify-between items-center bg-surface-2">
							<div>
								<h3 className="text-2xl font-black text-white">
									#{ticket.orderNumber}
								</h3>
								<p className="text-[10px] uppercase font-bold text-text-muted">
									{ticket.source}
								</p>
							</div>
							<div className="text-right">
								<span className="text-3xl font-mono font-black text-white drop-shadow-md">
									{getElapsedTimeString(ticket.createdAt)}
								</span>
							</div>
						</div>

						{/* Ticket Body (Items) */}
						<div className="flex-1 p-4 overflow-y-auto space-y-4 text-white">
							{ticket.items.map((item, idx) => (
								<div
									key={idx}
									className="border-b border-glass-border pb-3 last:border-0 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
								>
									<div className="flex gap-3 text-lg font-medium">
										<span className="min-w-[24px] h-[24px] bg-surface-2 border border-glass-border rounded flex items-center justify-center text-sm font-bold">
											{item.qty}
										</span>
										<span>{item.name}</span>
									</div>
									{item.mods && (
										<ul className="pl-9 mt-1 space-y-1">
											{item.mods.map((mod) => (
												<li
													key={mod}
													className="text-sm font-bold text-red-400"
												>
													NO {mod.replace("No ", "").toUpperCase()}
												</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>

						{/* Actions */}
						<div className="p-2 bg-surface-2 grid grid-cols-2 gap-2 border-t border-glass-border">
							{ticket.status === "new" ? (
								<button
									onClick={() => updateTicketStatus(ticket.id, "cooking")}
									className="col-span-2 py-3 bg-(--color-brand) text-white font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all outline-none"
								>
									FIRE
								</button>
							) : (
								<>
									<button className="py-3 bg-transparent border border-glass-border text-white font-bold rounded-lg hover:bg-white/5 active:scale-95 transition-all outline-none">
										RE-FIRE
									</button>
									<button
										onClick={() => updateTicketStatus(ticket.id, "ready")}
										className="py-3 bg-emerald-600 text-white font-black tracking-wider rounded-lg hover:bg-emerald-500 active:scale-95 transition-all outline-none shadow-lg"
									>
										BUMP
									</button>
								</>
							)}
						</div>
					</div>
				))}
			</main>
		</div>
	);
}
