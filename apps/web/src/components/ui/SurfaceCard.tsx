import type { ReactNode } from "react";

interface SurfaceCardProps {
	children: ReactNode;
	className?: string;
	interactive?: boolean;
}

/**
 * Global Surface Card component - consistent card styling across all pages
 * Uses the site's bronze accent color palette and glass morphism
 */
export function SurfaceCard({
	children,
	className = "",
	interactive = false,
}: SurfaceCardProps) {
	const baseClasses =
		"surface-card relative overflow-hidden rounded-[1.15rem] border border-white/[0.06] bg-gradient-to-br from-[rgba(14,19,32,0.97)] via-[rgba(9,13,22,0.94)] to-[rgba(12,18,30,0.96)] p-[clamp(1.2rem,2.4vw,1.6rem)] shadow-[0_32px_80px_-40px_rgba(2,6,23,0.95),0_0_0_1px_rgba(255,252,245,0.04)_inset] backdrop-blur-[24px] transition-all duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]";

	const interactiveClasses = interactive
		? "hover:-translate-y-[3px] hover:border-[rgba(96,165,250,0.2)] hover:shadow-[0_40px_90px_-36px_rgba(2,6,23,0.98),0_0_0_1px_rgba(255,252,245,0.06)_inset]"
		: "";

	return (
		<div className={`${baseClasses} ${interactiveClasses} ${className}`}>
			{children}
		</div>
	);
}

interface TileGridProps {
	children: ReactNode;
	className?: string;
	columns?: 2 | 3 | 4;
}

/**
 * Global Tile Grid component - responsive grid layout for cards
 */
export function TileGrid({
	children,
	className = "",
	columns = 3,
}: TileGridProps) {
	const columnClasses = {
		2: "grid-cols-1 md:grid-cols-2",
		3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
	};

	return (
		<div
			className={`grid gap-[clamp(1rem,2.2vw,1.35rem)] ${columnClasses[columns]} ${className}`}
		>
			{children}
		</div>
	);
}
