interface ScoreRingProps {
	score: number | null;
	label: string;
}

export function ScoreRing({ score, label }: ScoreRingProps) {
	const radius = 36;
	const circumference = 2 * Math.PI * radius;
	const pct = score == null ? 0 : score;
	const strokeDashoffset = circumference - (pct / 100) * circumference;

	let colorClass = "text-danger";
	if (score == null) colorClass = "text-white/35";
	else if (score >= 90) colorClass = "text-success";
	else if (score >= 50) colorClass = "text-warning";

	return (
		<div className="flex flex-col items-center gap-3">
			<div className="relative flex h-24 w-24 items-center justify-center drop-shadow-[0_0_20px_rgba(56,189,248,0.12)]">
				{/* Background Ring */}
				<svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
					<title>
						{score == null
							? `${label}: not available`
							: `${label} score: ${score}`}
					</title>
					<circle
						cx="40"
						cy="40"
						r={radius}
						stroke="currentColor"
						strokeWidth="6"
						fill="transparent"
						className="text-white/10"
					/>
					{/* Progress Ring */}
					{score != null ? (
						<circle
							cx="40"
							cy="40"
							r={radius}
							stroke="currentColor"
							strokeWidth="6"
							fill="transparent"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							className={`transition-all duration-1000 ease-out ${colorClass}`}
							strokeLinecap="round"
						/>
					) : null}
				</svg>
				<div
					className={`absolute text-2xl font-display font-medium ${colorClass}`}
				>
					{score == null ? "—" : score}
				</div>
			</div>
			<span className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/75">
				{label}
			</span>
		</div>
	);
}
