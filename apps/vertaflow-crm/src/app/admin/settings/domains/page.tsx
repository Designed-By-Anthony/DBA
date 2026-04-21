export const dynamic = "force-dynamic";

import type { TenantDomainRow } from "@dba/database";
import { listTenantDomains } from "@/lib/services/db";
import DomainSettingsClient from "./DomainSettingsClient";

export default async function DomainSettingsPage() {
	let domains: TenantDomainRow[] = [];
	let loadError: string | undefined;

	try {
		domains = await listTenantDomains();
	} catch (error) {
		loadError =
			error instanceof Error
				? error.message
				: "Domain settings are unavailable";
	}

	return (
		<DomainSettingsClient initialDomains={domains} loadError={loadError} />
	);
}
