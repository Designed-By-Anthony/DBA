"use client";

import Dexie, { type EntityTable } from "dexie";

export interface PortalTicketSummary {
	id: string;
	subject: string;
	status: string;
	createdAt: string;
}

export interface PortalData {
	offlineCacheKey?: string;
	prospect: {
		name: string;
		company: string;
		status: string;
		onboarding?: {
			contractSigned: boolean;
			downPaymentReceived: boolean;
			logoUploaded: boolean;
			photosUploaded: boolean;
			serviceDescriptions: boolean;
			domainAccess: boolean;
		};
		driveFolderUrl?: string;
		contractDocUrl?: string;
		pricingTier?: string;
		projectNotes?: string | null;
		contractSigned?: boolean;
		contractStatus?: string;
		stagingUrl?: string | null;
	};
	milestones: Array<{
		label: string;
		completed: boolean;
		current: boolean;
	}>;
	tickets: PortalTicketSummary[];
}

export interface PortalTicketThread {
	id: string;
	subject: string;
	description: string;
	status: string;
	priority: string;
	adminReply: string | null;
	messages: Array<{
		id: string;
		from: string;
		content: string;
		createdAt: string;
	}>;
	createdAt: string;
}

type PortalSnapshotRecord = {
	cacheKey: string;
	data: PortalData;
	updatedAt: number;
};

type PortalTicketRecord = PortalTicketThread & {
	cacheKey: string;
	queued: 0 | 1;
	updatedAt: number;
};

type PendingPortalTicketRecord = {
	id: string;
	cacheKey: string;
	subject: string;
	description: string;
	createdAt: string;
	attempts: number;
	lastError?: string;
};

type PortalMetaRecord = {
	key: string;
	value: string;
	updatedAt: number;
};

const ACTIVE_PORTAL_CACHE_KEY = "active-portal-cache-key";

class PortalOfflineDatabase extends Dexie {
	portalSnapshots!: EntityTable<PortalSnapshotRecord, "cacheKey">;
	portalTickets!: EntityTable<PortalTicketRecord, "id">;
	pendingPortalTickets!: EntityTable<PendingPortalTicketRecord, "id">;
	meta!: EntityTable<PortalMetaRecord, "key">;

	constructor() {
		super("vertaflow-portal-offline");
		this.version(1).stores({
			portalSnapshots: "cacheKey, updatedAt",
			portalTickets: "id, cacheKey, queued, createdAt, updatedAt",
			pendingPortalTickets: "id, cacheKey, createdAt",
			meta: "key, updatedAt",
		});
	}
}

let portalOfflineDb: PortalOfflineDatabase | null = null;

function getPortalOfflineDb(): PortalOfflineDatabase | null {
	if (typeof window === "undefined") return null;
	if (!portalOfflineDb) {
		portalOfflineDb = new PortalOfflineDatabase();
	}
	return portalOfflineDb;
}

export async function setActivePortalCacheKey(cacheKey: string): Promise<void> {
	const db = getPortalOfflineDb();
	if (!db) return;
	await db.meta.put({
		key: ACTIVE_PORTAL_CACHE_KEY,
		value: cacheKey,
		updatedAt: Date.now(),
	});
}

export async function getActivePortalCacheKey(): Promise<string | null> {
	const db = getPortalOfflineDb();
	if (!db) return null;
	return (await db.meta.get(ACTIVE_PORTAL_CACHE_KEY))?.value ?? null;
}

export async function cachePortalData(data: PortalData): Promise<void> {
	const db = getPortalOfflineDb();
	const cacheKey = data.offlineCacheKey;
	if (!db || !cacheKey) return;

	await db.portalSnapshots.put({
		cacheKey,
		data,
		updatedAt: Date.now(),
	});
	await setActivePortalCacheKey(cacheKey);
}

export async function getCachedPortalData(
	cacheKey?: string | null,
): Promise<PortalData | null> {
	const db = getPortalOfflineDb();
	if (!db) return null;

	const resolvedKey = cacheKey ?? (await getActivePortalCacheKey());
	if (!resolvedKey) return null;

	return (await db.portalSnapshots.get(resolvedKey))?.data ?? null;
}

export async function cachePortalTickets(
	cacheKey: string,
	tickets: PortalTicketThread[],
): Promise<void> {
	const db = getPortalOfflineDb();
	if (!db) return;

	const queuedTickets = await db.portalTickets
		.where("cacheKey")
		.equals(cacheKey)
		.filter((ticket) => ticket.queued === 1)
		.toArray();

	await db.transaction("rw", db.portalTickets, db.meta, async () => {
		const existing = await db.portalTickets
			.where("cacheKey")
			.equals(cacheKey)
			.toArray();
		const nonQueuedIds = existing
			.filter((ticket) => ticket.queued === 0)
			.map((ticket) => ticket.id);
		if (nonQueuedIds.length > 0) {
			await db.portalTickets.bulkDelete(nonQueuedIds);
		}

		if (tickets.length > 0) {
			await db.portalTickets.bulkPut(
				tickets.map((ticket) => ({
					...ticket,
					cacheKey,
					queued: 0,
					updatedAt: Date.now(),
				})),
			);
		}

		if (queuedTickets.length > 0) {
			await db.portalTickets.bulkPut(queuedTickets);
		}
	});
}

export async function getCachedPortalTickets(
	cacheKey?: string | null,
): Promise<PortalTicketThread[]> {
	const db = getPortalOfflineDb();
	if (!db) return [];

	const resolvedKey = cacheKey ?? (await getActivePortalCacheKey());
	if (!resolvedKey) return [];

	const rows = await db.portalTickets
		.where("cacheKey")
		.equals(resolvedKey)
		.reverse()
		.sortBy("createdAt");

	return (
		rows
			.reverse()
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.map(({ cacheKey, queued, updatedAt, ...ticket }) => ticket)
	);
}

export async function queuePortalTicket(
	cacheKey: string,
	input: {
		subject: string;
		description: string;
	},
): Promise<PortalTicketThread> {
	const db = getPortalOfflineDb();
	const createdAt = new Date().toISOString();
	const id =
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? `queued-${crypto.randomUUID()}`
			: `queued-${Date.now()}`;

	const queuedTicket: PortalTicketThread = {
		id,
		subject: input.subject,
		description: input.description,
		status: "queued",
		priority: "medium",
		adminReply: null,
		messages: [
			{
				id: `${id}-message`,
				from: "client",
				content: input.description || input.subject,
				createdAt,
			},
		],
		createdAt,
	};

	if (!db) return queuedTicket;

	await db.transaction(
		"rw",
		db.pendingPortalTickets,
		db.portalTickets,
		async () => {
			await db.pendingPortalTickets.put({
				id,
				cacheKey,
				subject: input.subject,
				description: input.description,
				createdAt,
				attempts: 0,
			});
			await db.portalTickets.put({
				...queuedTicket,
				cacheKey,
				queued: 1,
				updatedAt: Date.now(),
			});
		},
	);

	return queuedTicket;
}

export async function getPendingPortalTicketCount(
	cacheKey?: string | null,
): Promise<number> {
	const db = getPortalOfflineDb();
	if (!db) return 0;

	const resolvedKey = cacheKey ?? (await getActivePortalCacheKey());
	if (!resolvedKey) return 0;

	return db.pendingPortalTickets.where("cacheKey").equals(resolvedKey).count();
}

export async function flushQueuedPortalTickets(
	cacheKey?: string | null,
): Promise<{
	sent: number;
	failed: number;
}> {
	const db = getPortalOfflineDb();
	if (!db) return { sent: 0, failed: 0 };

	const resolvedKey = cacheKey ?? (await getActivePortalCacheKey());
	if (!resolvedKey) return { sent: 0, failed: 0 };

	const pending = await db.pendingPortalTickets
		.where("cacheKey")
		.equals(resolvedKey)
		.sortBy("createdAt");

	let sent = 0;
	let failed = 0;

	for (const ticket of pending) {
		try {
			const response = await fetch("/api/portal/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subject: ticket.subject,
					description: ticket.description,
				}),
			});

			if (!response.ok) {
				failed += 1;
				await db.pendingPortalTickets.put({
					...ticket,
					attempts: ticket.attempts + 1,
					lastError: `HTTP ${response.status}`,
				});
				continue;
			}

			sent += 1;
			await db.pendingPortalTickets.delete(ticket.id);
			await db.portalTickets.delete(ticket.id);
		} catch {
			failed += 1;
			await db.pendingPortalTickets.put({
				...ticket,
				attempts: ticket.attempts + 1,
				lastError: "network-error",
			});
			break;
		}
	}

	return { sent, failed };
}
