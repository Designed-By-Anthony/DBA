export default function PipelineLoading() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="h-6 w-28 bg-white/5 rounded" />
			<div className="flex gap-4 overflow-hidden">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="min-w-[300px] h-96 rounded-xl border border-[var(--color-glass-border)]"
						style={{
							background:
								"linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)",
							backgroundSize: "200% 100%",
							animation: "shimmer 1.5s infinite",
						}}
					/>
				))}
			</div>
		</div>
	);
}
