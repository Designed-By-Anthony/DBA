"use client";

import { ActivityIcon, ArrowRightIcon, ChefHatIcon } from "lucide-react";
import Link from "next/link";

/**
 * Restaurant vertical — KDS entry point.
 * This sits in the top chrome for restaurant tenants and provides a quick launch into the Expediter KDS.
 */
export default function KitchenDisplay() {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
			<div className="flex items-center gap-4">
				<div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
					<ChefHatIcon className="h-6 w-6 text-orange-400" />
					<div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-surface-1">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
						<span className="relative text-[9px] font-bold text-white">!</span>
					</div>
				</div>
				<div>
					<h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
						Restaurant Operations
						<span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
							<ActivityIcon className="h-3 w-3" /> Live
						</span>
					</h2>
					<p className="text-sm text-text-muted mt-0.5">
						Manage your live orders, tickets, and kitchen flow.
					</p>
				</div>
			</div>

			<Link
				href="/admin/kds"
				className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-orange-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] active:scale-95 border border-orange-500/50"
			>
				<span className="relative z-10 flex items-center gap-2">
					Launch KDS
				</span>
				<ArrowRightIcon className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />

				{/* Shine effect */}
				<div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
			</Link>
		</div>
	);
}
