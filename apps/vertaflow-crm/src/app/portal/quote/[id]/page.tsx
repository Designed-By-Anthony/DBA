import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Quote page — currently returns "not found" since quotes table
 * is not yet migrated to Neon. Will be re-enabled once the
 * quotes schema is pushed.
 */
export default async function PortalQuotePage(props: {
	params: { id: string };
}) {
	void props;
	notFound();
}
