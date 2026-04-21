import type { Quote, QuoteItem, QuotePackage, QuoteTier } from "@/lib/types";

export type DocumentData = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

export function stringFromDocument(
	data: DocumentData,
	key: string,
	fallback = "",
): string {
	const value = data[key];
	return typeof value === "string" && value.length > 0 ? value : fallback;
}

function optionalStringFromRecord(
	data: Record<string, unknown>,
	key: string,
): string | undefined {
	const value = data[key];
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalStringFromDocument(
	data: DocumentData,
	key: string,
): string | undefined {
	const value = data[key];
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberFromRecord(data: Record<string, unknown>, key: string): number {
	const value = data[key];
	return typeof value === "number" ? value : 0;
}

function quoteTier(value: unknown): QuoteTier {
	return value === "good" || value === "better" || value === "best"
		? value
		: "standard";
}

function quoteStatus(value: unknown): Quote["status"] {
	return value === "sent" ||
		value === "viewed" ||
		value === "accepted" ||
		value === "declined"
		? value
		: "draft";
}

function quoteItem(value: unknown): QuoteItem | null {
	if (!isRecord(value)) return null;

	const type = value.type === "recurring" ? "recurring" : "one_time";
	const item: QuoteItem = {
		stripeProductId: optionalStringFromRecord(value, "stripeProductId") || "",
		name: optionalStringFromRecord(value, "name") || "Line item",
		priceCents: numberFromRecord(value, "priceCents"),
		type,
	};

	if (
		type === "recurring" &&
		(value.interval === "month" || value.interval === "year")
	) {
		item.interval = value.interval;
	}

	return item;
}

function quotePackage(value: unknown): QuotePackage | null {
	if (!isRecord(value)) return null;

	const rawItems = value.items;
	const items = Array.isArray(rawItems)
		? rawItems.map(quoteItem).filter((item): item is QuoteItem => item !== null)
		: [];

	return {
		id: optionalStringFromRecord(value, "id") || quoteTier(value.tier),
		tier: quoteTier(value.tier),
		title: optionalStringFromRecord(value, "title") || "Package",
		description: optionalStringFromRecord(value, "description"),
		items,
		totalOneTimeCents: numberFromRecord(value, "totalOneTimeCents"),
		totalRecurringCents: numberFromRecord(value, "totalRecurringCents"),
	};
}

export function quoteFromDocument(id: string, data: DocumentData): Quote {
	const rawPackages = data.packages;
	const packages = Array.isArray(rawPackages)
		? rawPackages
				.map(quotePackage)
				.filter((pkg): pkg is QuotePackage => pkg !== null)
		: [];

	return {
		id: stringFromDocument(data, "id", id),
		agencyId: stringFromDocument(data, "agencyId"),
		prospectId: stringFromDocument(data, "prospectId"),
		status: quoteStatus(data.status),
		packages,
		selectedPackageId: optionalStringFromDocument(data, "selectedPackageId"),
		signatureDataUrl: optionalStringFromDocument(data, "signatureDataUrl"),
		signedAt: optionalStringFromDocument(data, "signedAt"),
		createdAt: stringFromDocument(data, "createdAt", new Date().toISOString()),
		expiresAt: optionalStringFromDocument(data, "expiresAt"),
	};
}
