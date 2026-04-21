"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getTenantSettings, updateTenantSettings } from "../actions";

type Stage = {
	id: string;
	label: string;
	color: string;
	probability: number;
	order: number;
};

export default function PipelinePage() {
	const [stages, setStages] = useState<Stage[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		async function load() {
			try {
				const t = await getTenantSettings();
				if (t?.pipelineStages && Array.isArray(t.pipelineStages)) {
					setStages(t.pipelineStages as Stage[]);
				} else {
					setStages([
						{
							id: "lead",
							label: "New Lead",
							color: "#3b82f6",
							probability: 0.1,
							order: 0,
						},
						{
							id: "contacted",
							label: "Contacted",
							color: "#3b82f6",
							probability: 0.25,
							order: 1,
						},
						{
							id: "proposal",
							label: "Proposal Sent",
							color: "#f59e0b",
							probability: 0.5,
							order: 2,
						},
						{
							id: "dev",
							label: "In Development",
							color: "#10b981",
							probability: 0.8,
							order: 3,
						},
						{
							id: "launched",
							label: "Launched",
							color: "#06d6a0",
							probability: 1.0,
							order: 4,
						},
					]);
				}
			} catch {}
			setLoading(false);
		}
		load();
	}, []);

	const handleSave = async () => {
		setSaving(true);
		setSaved(false);
		try {
			const ordered = stages.map((s, i) => ({ ...s, order: i }));
			await updateTenantSettings({ pipelineStages: ordered });
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} catch {}
		setSaving(false);
	};

	const addStage = () => {
		const id = `stage_${Date.now()}`;
		setStages([
			...stages,
			{
				id,
				label: "New Stage",
				color: "#6366f1",
				probability: 0.5,
				order: stages.length,
			},
		]);
	};

	const removeStage = (id: string) => {
		if (stages.length <= 2) return; // Minimum 2 stages
		setStages(stages.filter((s) => s.id !== id));
	};

	const updateStage = (
		id: string,
		field: keyof Stage,
		value: string | number,
	) => {
		setStages(stages.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
	};

	const moveStage = (index: number, direction: "up" | "down") => {
		const next = [...stages];
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= next.length) return;
		[next[index], next[targetIndex]] = [next[targetIndex], next[index]];
		setStages(next);
	};

	if (loading) {
		return (
			<div className="space-y-6 max-w-2xl animate-pulse">
				<div className="h-8 bg-surface-2 rounded w-40" />
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="h-16 bg-surface-2 rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-2xl">
			<div>
				<h1 className="text-xl font-bold text-white">Pipeline Stages</h1>
				<p className="text-xs text-text-muted mt-1">
					Customize your deal pipeline stages, colors, and win probabilities
				</p>
			</div>

			<div className="space-y-2">
				{stages.map((stage, idx) => (
					<div
						key={stage.id}
						className="flex items-center gap-3 p-3 bg-surface-1 border border-glass-border rounded-xl group"
					>
						<div className="flex flex-col gap-0.5">
							<button
								onClick={() => moveStage(idx, "up")}
								disabled={idx === 0}
								className="text-text-gray hover:text-white disabled:opacity-20 transition-colors"
							>
								<GripVertical size={14} />
							</button>
							<button
								onClick={() => moveStage(idx, "down")}
								disabled={idx === stages.length - 1}
								className="text-text-gray hover:text-white disabled:opacity-20 transition-colors"
							>
								<GripVertical size={14} />
							</button>
						</div>

						<input
							type="color"
							value={stage.color}
							onChange={(e) => updateStage(stage.id, "color", e.target.value)}
							className="w-8 h-8 rounded border border-glass-border cursor-pointer bg-transparent shrink-0"
						/>

						<input
							type="text"
							value={stage.label}
							onChange={(e) => updateStage(stage.id, "label", e.target.value)}
							className="flex-1 bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-(--color-brand)"
							placeholder="Stage name"
						/>

						<div className="flex items-center gap-1.5 shrink-0">
							<input
								type="number"
								min={0}
								max={100}
								step={5}
								value={Math.round(stage.probability * 100)}
								onChange={(e) =>
									updateStage(
										stage.id,
										"probability",
										(parseInt(e.target.value) || 0) / 100,
									)
								}
								className="w-16 bg-surface-2 border border-glass-border rounded-lg px-2 py-2 text-sm text-white text-center outline-none focus:border-(--color-brand)"
							/>
							<span className="text-xs text-text-gray">%</span>
						</div>

						<button
							onClick={() => removeStage(stage.id)}
							disabled={stages.length <= 2}
							className="p-1.5 rounded-lg text-text-gray hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
						>
							<Trash2 size={14} />
						</button>
					</div>
				))}
			</div>

			<button
				onClick={addStage}
				className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-glass-border text-text-gray hover:text-white hover:border-(--color-brand) transition-colors text-sm"
			>
				<Plus size={14} /> Add Stage
			</button>

			<div className="flex items-center gap-3 pt-2">
				<button
					onClick={handleSave}
					disabled={saving}
					className="px-6 py-2.5 rounded-lg bg-(--color-brand) text-white text-sm font-semibold hover:bg-brand-hover transition-all disabled:opacity-50"
				>
					{saving ? "Saving..." : "Save Pipeline"}
				</button>
				{saved && (
					<span className="text-xs text-emerald-400 animate-fade-in">
						✓ Saved
					</span>
				)}
			</div>
		</div>
	);
}
