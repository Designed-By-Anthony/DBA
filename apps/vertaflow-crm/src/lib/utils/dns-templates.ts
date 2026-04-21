import type { TenantDomainDnsRecord } from "@dba/database";

export const DMARC_VALUE = "v=DMARC1; p=none;";

export type DnsInstructionGroup = {
	id: TenantDomainDnsRecord["group"];
	label: string;
	description: string;
	records: TenantDomainDnsRecord[];
};

export function createDmarcRecord(domainName: string): TenantDomainDnsRecord {
	return {
		group: "dmarc",
		record: "DMARC",
		name: `_dmarc.${domainName}`,
		type: "TXT",
		value: DMARC_VALUE,
		ttl: "Auto",
		status: "pending",
	};
}

export function withRecommendedDmarc(
	domainName: string,
	records: TenantDomainDnsRecord[],
): TenantDomainDnsRecord[] {
	const hasDmarc = records.some((record) => record.group === "dmarc");
	return hasDmarc ? records : [...records, createDmarcRecord(domainName)];
}

export function groupDnsInstructions(
	domainName: string,
	records: TenantDomainDnsRecord[],
): DnsInstructionGroup[] {
	const allRecords = withRecommendedDmarc(domainName, records);
	const groups: DnsInstructionGroup[] = [
		{
			id: "verification",
			label: "Verification",
			description:
				"Records Resend uses to prove ownership and authorize sending.",
			records: [],
		},
		{
			id: "dkim",
			label: "DKIM",
			description: "CNAME records that cryptographically sign outbound mail.",
			records: [],
		},
		{
			id: "dmarc",
			label: "DMARC",
			description: "A safe reporting-first policy while the domain warms up.",
			records: [],
		},
	];

	for (const record of allRecords) {
		const group = groups.find((item) => item.id === record.group);
		if (group) {
			group.records.push(record);
		}
	}

	return groups.filter((group) => group.records.length > 0);
}
