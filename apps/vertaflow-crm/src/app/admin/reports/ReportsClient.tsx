"use client";

import { useState } from "react";
import { exportProspectsCsv } from "../reporting-actions";

export default function ReportsClient() {
	const [busy, setBusy] = useState(false);

	const downloadCsv = async () => {
		setBusy(true);
		try {
			const res = await exportProspectsCsv();
			if (res.error || !res.csv) {
				alert(res.error || "Export failed");
				return;
			}
			const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setBusy(false);
		}
	};

	return (
		<button
			type="button"
			onClick={() => void downloadCsv()}
			disabled={busy}
			className="px-4 py-2 rounded-lg bg-(--color-brand) hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-50"
		>
			{busy ? "Preparing…" : "Download prospects CSV"}
		</button>
	);
}
