"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { EmailSequenceDefinition, EmailSequenceStep } from "@/lib/types";
import {
	createEmailSequence,
	deleteEmailSequence,
	runDueSequenceEmails,
	updateEmailSequence,
} from "./actions";

const emptyStep = (): EmailSequenceStep => ({
	delayHours: 24,
	subject: "Following up",
	bodyHtml: "<p>Hi {{name}},</p><p>Just checking in.</p>",
});

export default function SequencesClient({
	initialSequences,
}: {
	initialSequences: EmailSequenceDefinition[];
}) {
	const [sequences, setSequences] = useState(initialSequences);
	const [name, setName] = useState("");
	const [steps, setSteps] = useState<EmailSequenceStep[]>([emptyStep()]);
	const [saving, setSaving] = useState(false);
	const [running, setRunning] = useState(false);

	const refresh = useCallback(async () => {
		const { listEmailSequences } = await import("./actions");
		setSequences(await listEmailSequences());
	}, []);

	const addSequence = async () => {
		if (!name.trim()) {
			toast.error("Name required");
			return;
		}
		setSaving(true);
		const res = await createEmailSequence({ name: name.trim(), steps });
		setSaving(false);
		if (!res.success) {
			toast.error(res.error || "Failed");
			return;
		}
		toast.success("Sequence created");
		setName("");
		setSteps([emptyStep()]);
		await refresh();
	};

	const toggleActive = async (s: EmailSequenceDefinition) => {
		await updateEmailSequence(s.id, { isActive: !s.isActive });
		await refresh();
	};

	const remove = async (id: string) => {
		if (
			!confirm(
				"Delete this sequence? Active enrollments may still process until cancelled.",
			)
		)
			return;
		await deleteEmailSequence(id);
		toast.success("Deleted");
		await refresh();
	};

	const runNow = async () => {
		setRunning(true);
		const res = await runDueSequenceEmails();
		setRunning(false);
		toast.success(`Processed ${res.processed} sends`);
		if (res.errors.length) {
			toast.message(res.errors.slice(0, 3).join(" · "));
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={() => void runNow()}
					disabled={running}
					className="px-4 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
				>
					{running ? "Running…" : "Run due emails now"}
				</button>
			</div>

			<div className="rounded-xl border border-glass-border bg-glass-bg p-6 space-y-4">
				<h2 className="text-sm font-semibold text-white">New sequence</h2>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Sequence name"
					className="w-full bg-surface-1 border border-glass-border rounded-lg px-3 py-2 text-sm text-white"
				/>
				{steps.map((st, i) => (
					<div
						key={i}
						className="grid grid-cols-1 md:grid-cols-4 gap-2 border border-glass-border rounded-lg p-3"
					>
						<div>
							<label className="text-[10px] text-text-muted uppercase">
								Delay (hours)
							</label>
							<input
								type="number"
								min={0}
								value={st.delayHours}
								onChange={(e) => {
									const next = [...steps];
									next[i] = { ...st, delayHours: Number(e.target.value) || 0 };
									setSteps(next);
								}}
								className="w-full bg-surface-2 border border-glass-border rounded px-2 py-1.5 text-sm text-white"
							/>
						</div>
						<div className="md:col-span-3 space-y-2">
							<input
								value={st.subject}
								onChange={(e) => {
									const next = [...steps];
									next[i] = { ...st, subject: e.target.value };
									setSteps(next);
								}}
								placeholder="Subject (supports {{name}}, {{company}})"
								className="w-full bg-surface-2 border border-glass-border rounded px-2 py-1.5 text-sm text-white"
							/>
							<textarea
								value={st.bodyHtml}
								onChange={(e) => {
									const next = [...steps];
									next[i] = { ...st, bodyHtml: e.target.value };
									setSteps(next);
								}}
								rows={3}
								className="w-full bg-surface-2 border border-glass-border rounded px-2 py-1.5 text-sm text-white font-mono"
							/>
						</div>
					</div>
				))}
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setSteps([...steps, emptyStep()])}
						className="text-xs text-(--color-brand) hover:underline"
					>
						+ Add step
					</button>
				</div>
				<button
					type="button"
					onClick={() => void addSequence()}
					disabled={saving}
					className="px-4 py-2 rounded-lg bg-(--color-brand) text-white text-sm font-medium disabled:opacity-50"
				>
					{saving ? "Saving…" : "Create sequence"}
				</button>
			</div>

			<div className="space-y-3">
				<h2 className="text-sm font-semibold text-white">Your sequences</h2>
				{sequences.length === 0 ? (
					<p className="text-sm text-text-muted">No sequences yet.</p>
				) : (
					sequences.map((s) => (
						<div
							key={s.id}
							className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-glass-border bg-glass-bg px-4 py-3"
						>
							<div>
								<p className="text-white font-medium">{s.name}</p>
								<p className="text-xs text-text-muted">
									{s.steps?.length || 0} steps ·{" "}
									{s.isActive ? "Active" : "Paused"}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => void toggleActive(s)}
									className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 text-white hover:bg-surface-3"
								>
									{s.isActive ? "Pause" : "Activate"}
								</button>
								<button
									type="button"
									onClick={() => void remove(s.id)}
									className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25"
								>
									Delete
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
