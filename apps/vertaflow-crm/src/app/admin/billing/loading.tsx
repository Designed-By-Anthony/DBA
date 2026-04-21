export default function BillingLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="h-6 w-48 bg-white/5 rounded" />
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-20"
					/>
				))}
			</div>
			<div className="rounded-xl border border-white/5 bg-white/[0.02] h-64" />
		</div>
	);
}
