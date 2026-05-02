export const dynamic = "force-dynamic";

import Image from "next/image";
import {
	createD1Client,
	type Lead,
	leads,
	type Transaction,
	transactions,
} from "@dba/shared/db/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc } from "drizzle-orm";

export default async function AdminLedgerPage() {
	let leadRows: Lead[] = [];
	let txRows: Transaction[] = [];

	try {
		const env = getCloudflareContext().env as { DB?: unknown };
		const d1 = env.DB;
		if (d1) {
			const db = createD1Client(d1);
			[leadRows, txRows] = await Promise.all([
				db.select().from(leads).orderBy(desc(leads.created_at)).limit(200),
				db
					.select()
					.from(transactions)
					.orderBy(desc(transactions.created_at))
					.limit(200),
			]);
		}
	} catch {
		leadRows = [];
		txRows = [];
	}

	return (
		<main className="mx-auto max-w-7xl px-6 py-12">
			<div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<Image
					src="/logos/anthony_master_wordmark.png"
					alt="ANTHONY. | Digital Infrastructure Architect"
					width={720}
					height={140}
					className="h-10 md:h-11 w-auto max-w-[min(92vw,20rem)] object-contain object-left"
					priority
				/>
				<p className="font-[family-name:var(--font-inter)] text-sm text-white/60 md:text-right md:max-w-xs">
					The Vault · Midnight ledger
				</p>
			</div>

			<section className="mt-10">
				<h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-white">
					315 Pipeline
				</h2>
				<div className="text-bubble is-bordered mt-4 overflow-x-auto">
					<table className="w-full border-collapse text-left text-sm font-[family-name:var(--font-inter)] text-white/90">
						<thead>
							<tr className="border-b border-white/10">
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Email
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Company
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Source
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Status
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Created
								</th>
							</tr>
						</thead>
						<tbody>
							{leadRows.length === 0 ? (
								<tr>
									<td colSpan={5} className="py-6 text-white/50">
										No rows (configure D1 binding `DB` or run migrations).
									</td>
								</tr>
							) : (
								leadRows.map((row) => (
									<tr key={row.id} className="border-b border-white/5">
										<td className="py-2 pr-4">{row.email}</td>
										<td className="py-2 pr-4">{row.company_name ?? "—"}</td>
										<td className="py-2 pr-4">{row.source}</td>
										<td className="py-2 pr-4">{row.status}</td>
										<td className="py-2 pr-4 tabular-nums">
											{row.created_at != null
												? new Date(row.created_at).toISOString()
												: "—"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			<section className="mt-12">
				<h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-white">
					Revenue Ledger
				</h2>
				<div className="text-bubble is-bordered mt-4 overflow-x-auto">
					<table className="w-full border-collapse text-left text-sm font-[family-name:var(--font-inter)] text-white/90">
						<thead>
							<tr className="border-b border-white/10">
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Session
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Customer
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Amount (¢)
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Plan
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Status
								</th>
								<th className="font-[family-name:var(--font-fraunces)] py-2 pr-4 font-semibold">
									Created
								</th>
							</tr>
						</thead>
						<tbody>
							{txRows.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-6 text-white/50">
										No transactions yet.
									</td>
								</tr>
							) : (
								txRows.map((row) => (
									<tr
										key={row.stripe_session_id}
										className="border-b border-white/5"
									>
										<td className="max-w-[14rem] truncate py-2 pr-4 font-mono text-xs">
											{row.stripe_session_id}
										</td>
										<td className="py-2 pr-4">{row.customer_email ?? "—"}</td>
										<td className="py-2 pr-4 tabular-nums">
											{row.amount_total ?? "—"}
										</td>
										<td className="py-2 pr-4">{row.plan_name ?? "—"}</td>
										<td className="py-2 pr-4">{row.status ?? "—"}</td>
										<td className="py-2 pr-4 tabular-nums">
											{row.created_at != null
												? new Date(row.created_at).toISOString()
												: "—"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</main>
	);
}
