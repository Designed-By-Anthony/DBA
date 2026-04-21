"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { EmailSequenceDefinition } from "@/lib/types";
import {
	enrollProspectInSequence,
	listEmailSequences,
} from "../email/sequences/actions";

export default function ProspectSequenceEnroll({
	prospectId,
}: {
	prospectId: string;
}) {
	const [sequences, setSequences] = useState<EmailSequenceDefinition[]>([]);
	const [seqId, setSeqId] = useState("");
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		const rows = await listEmailSequences();
		setSequences(rows.filter((s) => s.isActive));
	}, []);

	useEffect(() => {
		queueMicrotask(() => void load());
	}, [load]);

	const enroll = async () => {
		if (!seqId) return;
		setLoading(true);
		const res = await enrollProspectInSequence(prospectId, seqId);
		setLoading(false);
		if (!res.success) {
			toast.error(res.error || "Could not enroll");
			return;
		}
		toast.success("Enrolled in sequence");
	};

	if (sequences.length === 0) {
		return (
			<p className="text-xs text-text-muted">
				No active email sequences.{" "}
				<a
					href="/admin/email/sequences"
					className="text-(--color-brand) hover:underline"
				>
					Create one
				</a>
			</p>
		);
	}

	return (
		<div className="flex flex-col sm:flex-row gap-2 sm:items-center">
			<select
				value={seqId}
				onChange={(e) => setSeqId(e.target.value)}
				className="flex-1 bg-surface-2 border border-glass-border rounded-lg px-3 py-2 text-sm text-white"
			>
				<option value="">Select sequence…</option>
				{sequences.map((s) => (
					<option key={s.id} value={s.id} className="bg-surface-1">
						{s.name}
					</option>
				))}
			</select>
			<button
				type="button"
				onClick={() => void enroll()}
				disabled={loading || !seqId}
				className="px-4 py-2 rounded-lg bg-(--color-brand) text-white text-sm font-medium disabled:opacity-50"
			>
				{loading ? "…" : "Enroll"}
			</button>
		</div>
	);
}
