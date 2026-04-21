import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import {
	getDb,
	type TenantDomainDnsRecord,
	type TenantDomainRow,
	tenantDomains,
	tenants,
	withTenantContext,
} from "@dba/database";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const domainNameSchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(4, "Enter a full domain")
	.max(253, "Domain is too long")
	.regex(
		/^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/,
		"Enter a root domain like client.com",
	);

export const saveTenantDomainSchema = z
	.object({
		domainName: domainNameSchema,
		resendId: z.string().min(1),
		status: z
			.enum([
				"pending",
				"verified",
				"failed",
				"temporary_failure",
				"not_started",
			])
			.default("pending"),
		records: z.array(
			z.object({
				group: z.enum(["verification", "dkim", "dmarc", "receiving"]),
				record: z.string().min(1),
				name: z.string().min(1),
				type: z.enum(["TXT", "CNAME", "MX"]),
				value: z.string().min(1),
				ttl: z.string().optional(),
				status: z
					.enum([
						"pending",
						"verified",
						"failed",
						"temporary_failure",
						"not_started",
					])
					.optional(),
				priority: z.number().optional(),
			}),
		),
	})
	.strict();

type TenantContext = {
	db: NonNullable<ReturnType<typeof getDb>>;
	tenantId: string;
};

function canUseAuthBypass(): boolean {
	if (process.env.ALLOW_ADMIN_AUTH_BYPASS !== "1") return false;
	return (
		process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
	);
}

export async function requireTenantContext(): Promise<TenantContext> {
	const { orgId } = await auth();
	const tenantId = orgId || (canUseAuthBypass() ? "dev-agency" : null);
	if (!tenantId) {
		throw new Error("No active organization");
	}

	const db = getDb();
	if (!db) {
		throw new Error("Database not configured");
	}

	return { db, tenantId };
}

export async function withCurrentTenant<T>(
	fn: (
		tx: Parameters<Parameters<TenantContext["db"]["transaction"]>[0]>[0],
		tenantId: string,
	) => Promise<T>,
): Promise<T> {
	const { db, tenantId } = await requireTenantContext();

	return withTenantContext(db, tenantId, async (tx) => {
		await tx
			.insert(tenants)
			.values({
				clerkOrgId: tenantId,
				name: tenantId === "dev-agency" ? "Development Agency" : tenantId,
				verticalType: "agency",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})
			.onConflictDoNothing({ target: tenants.clerkOrgId });

		return fn(tx, tenantId);
	});
}

export async function listTenantDomains(): Promise<TenantDomainRow[]> {
	return withCurrentTenant(async (tx, tenantId) => {
		return tx
			.select()
			.from(tenantDomains)
			.where(eq(tenantDomains.tenantId, tenantId))
			.orderBy(desc(tenantDomains.createdAt));
	});
}

export async function getTenantDomain(
	domainId: string,
): Promise<TenantDomainRow | null> {
	return withCurrentTenant(async (tx, tenantId) => {
		const rows = await tx
			.select()
			.from(tenantDomains)
			.where(
				and(
					eq(tenantDomains.tenantId, tenantId),
					eq(tenantDomains.id, domainId),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	});
}

export async function saveTenantDomain(
	input: z.infer<typeof saveTenantDomainSchema>,
): Promise<TenantDomainRow> {
	const parsed = saveTenantDomainSchema.parse(input);
	const now = new Date().toISOString();

	return withCurrentTenant(async (tx, tenantId) => {
		const rows = await tx
			.insert(tenantDomains)
			.values({
				tenantId,
				domainName: parsed.domainName,
				resendId: parsed.resendId,
				status: parsed.status,
				records: parsed.records as TenantDomainDnsRecord[],
				lastCheckedAt: now,
				verifiedAt: parsed.status === "verified" ? now : null,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [tenantDomains.tenantId, tenantDomains.domainName],
				set: {
					resendId: parsed.resendId,
					status: parsed.status,
					records: parsed.records as TenantDomainDnsRecord[],
					lastCheckedAt: now,
					verifiedAt: parsed.status === "verified" ? now : null,
					updatedAt: now,
				},
			})
			.returning();

		return rows[0];
	});
}

export async function updateTenantDomainStatus(
	domainId: string,
	input: Pick<z.infer<typeof saveTenantDomainSchema>, "status" | "records">,
): Promise<TenantDomainRow> {
	const parsed = saveTenantDomainSchema
		.pick({ status: true, records: true })
		.parse(input);
	const now = new Date().toISOString();

	return withCurrentTenant(async (tx, tenantId) => {
		const rows = await tx
			.update(tenantDomains)
			.set({
				status: parsed.status,
				records: parsed.records as TenantDomainDnsRecord[],
				lastCheckedAt: now,
				verifiedAt: parsed.status === "verified" ? now : undefined,
				updatedAt: now,
			})
			.where(
				and(
					eq(tenantDomains.tenantId, tenantId),
					eq(tenantDomains.id, domainId),
				),
			)
			.returning();

		if (!rows[0]) {
			throw new Error("Domain not found");
		}

		return rows[0];
	});
}
