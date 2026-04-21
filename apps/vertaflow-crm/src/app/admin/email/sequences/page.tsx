import Link from "next/link";
import { listEmailSequences } from "./actions";
import SequencesClient from "./SequencesClient";

export default async function EmailSequencesPage() {
	let sequences: Awaited<ReturnType<typeof listEmailSequences>> = [];
	try {
		sequences = await listEmailSequences();
	} catch {
		sequences = [];
	}

	return (
		<div className="space-y-6 max-w-4xl">
			<div>
				<h1 className="text-2xl font-bold text-white">Email sequences</h1>
				<p className="text-sm text-text-muted mt-1">
					Drip campaigns with delays between steps. Processing runs on a
					schedule (cron) or manually below.
				</p>
				<p className="text-xs text-text-muted mt-2">
					Use{" "}
					<code className="text-(--color-brand)">
						GET /api/cron/email-sequences
					</code>{" "}
					with{" "}
					<code className="text-(--color-brand)">
						Authorization: Bearer CRON_SECRET
					</code>
					.
				</p>
			</div>
			<SequencesClient initialSequences={sequences} />
			<Link
				href="/admin/email"
				className="text-sm text-(--color-brand) hover:underline inline-block"
			>
				← Back to Email
			</Link>
		</div>
	);
}
