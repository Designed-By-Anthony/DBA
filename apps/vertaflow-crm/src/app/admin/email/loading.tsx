export default function EmailLoading() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="h-6 w-40 bg-white/5 rounded" />
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				<div
					className="lg:col-span-2 h-96 rounded-xl border border-[var(--color-glass-border)]"
					style={{
						background:
							"linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
						backgroundSize: "200% 100%",
						animation: "shimmer 1.5s infinite",
					}}
				/>
				<div
					className="lg:col-span-3 h-96 rounded-xl border border-[var(--color-glass-border)]"
					style={{
						background:
							"linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
						backgroundSize: "200% 100%",
						animation: "shimmer 1.5s infinite",
					}}
				/>
			</div>
		</div>
	);
}
