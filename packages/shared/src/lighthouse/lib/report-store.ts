/**
 * Audit report store with Cloudflare KV persistence.
 *
 * When the `AUDIT_REPORTS_KV` binding is available (production Worker),
 * reports are persisted to Cloudflare KV with a 90-day TTL. The
 * in-memory Map acts as a hot cache for the lifetime of the Worker
 * isolate. Without the KV binding (local dev), the store is purely
 * in-memory and reports vanish on restart.
 */

type TimestampLike = {
	toDate: () => Date;
	toMillis: () => number;
};

function toTimestamp(value: Date | string | number): TimestampLike {
	const date = value instanceof Date ? value : new Date(value);
	return {
		toDate: () => date,
		toMillis: () => date.getTime(),
	};
}

type StoredReport = Record<string, unknown> & {
	id?: string;
	createdAt?: TimestampLike | null;
	psiDegradedReason?: string | null;
	lead?: {
		name?: string;
		email?: string;
		company?: string;
		url?: string;
		location?: string;
	};
	scores?: Record<string, unknown>;
	metrics?: Record<string, unknown>;
	diagnostics?: Record<string, unknown>;
	aiInsight?: Record<string, unknown>;
	htmlSignals?: Record<string, unknown>;
	sitewide?: Record<string, unknown>;
	backlinks?: Record<string, unknown>;
	indexCoverage?: Record<string, unknown>;
	places?: Record<string, unknown>;
	competitors?: unknown[];
	emailSentCount?: number;
	emailLastSentAt?: TimestampLike | null;
	emailSendLockUntil?: TimestampLike | null;
};

const REPORTS = new Map<string, StoredReport>();
const REPORT_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

/**
 * Minimal KV interface — matches the subset of Cloudflare KVNamespace
 * that we actually use, so the shared package doesn't need a direct
 * dependency on `@cloudflare/workers-types`.
 */
interface KVLike {
	get(key: string, options?: { type?: string }): Promise<string | null>;
	put(
		key: string,
		value: string,
		options?: { expirationTtl?: number },
	): Promise<void>;
}

let _kv: KVLike | null = null;

/** Call once at Worker startup to wire the KV binding. */
export function setReportKV(kv: KVLike | undefined): void {
	_kv = kv ?? null;
}

function serializeForKV(report: StoredReport): string {
	return JSON.stringify(report, (_key, value) => {
		if (
			value &&
			typeof value === "object" &&
			"toDate" in value &&
			typeof value.toDate === "function"
		) {
			return { __ts: (value as TimestampLike).toMillis() };
		}
		return value;
	});
}

function deserializeFromKV(raw: string): StoredReport {
	return JSON.parse(raw, (_key, value) => {
		if (value && typeof value === "object" && "__ts" in value) {
			return toTimestamp(value.__ts as number);
		}
		return value;
	}) as StoredReport;
}

export const Timestamp = {
	now(): TimestampLike {
		return toTimestamp(new Date());
	},
	fromMillis(ms: number): TimestampLike {
		return toTimestamp(ms);
	},
};

export const FieldValue = {
	increment(by: number) {
		return { __op: "increment" as const, by };
	},
	delete() {
		return { __op: "delete" as const };
	},
};

function applyPatch(
	target: StoredReport,
	patch: Record<string, unknown>,
): StoredReport {
	const next = { ...target };
	for (const [key, value] of Object.entries(patch)) {
		if (value && typeof value === "object" && "__op" in value) {
			const op = value as { __op: "increment" | "delete"; by?: number };
			if (op.__op === "increment") {
				const prev = Number(next[key] ?? 0);
				next[key] = prev + Number(op.by ?? 0);
			} else if (op.__op === "delete") {
				delete next[key];
			}
			continue;
		}
		next[key] = value;
	}
	return next;
}

function makeDocRef(id: string) {
	return {
		id,
		async create(payload: StoredReport) {
			if (REPORTS.has(id)) {
				const err = new Error("already exists") as Error & {
					code?: number | string;
				};
				err.code = "already-exists";
				throw err;
			}
			REPORTS.set(id, payload);
			if (_kv) {
				try {
					await _kv.put(id, serializeForKV(payload), {
						expirationTtl: REPORT_TTL_SECONDS,
					});
				} catch (e) {
					console.error("[report-store] KV write failed:", e);
				}
			}
		},
		async get() {
			let data = REPORTS.get(id);
			if (!data && _kv) {
				try {
					const raw = await _kv.get(id, { type: "text" });
					if (raw) {
						data = deserializeFromKV(raw);
						REPORTS.set(id, data);
					}
				} catch (e) {
					console.error("[report-store] KV read failed:", e);
				}
			}
			return {
				exists: Boolean(data),
				data: () => data,
			};
		},
		async update(payload: Record<string, unknown>) {
			let existing = REPORTS.get(id);
			if (!existing && _kv) {
				try {
					const raw = await _kv.get(id, { type: "text" });
					if (raw) {
						existing = deserializeFromKV(raw);
						REPORTS.set(id, existing);
					}
				} catch (e) {
					console.error("[report-store] KV read failed:", e);
				}
			}
			if (!existing) {
				throw new Error("not found");
			}
			const updated = applyPatch(existing, payload);
			REPORTS.set(id, updated);
			if (_kv) {
				try {
					await _kv.put(id, serializeForKV(updated), {
						expirationTtl: REPORT_TTL_SECONDS,
					});
				} catch (e) {
					console.error("[report-store] KV write failed:", e);
				}
			}
		},
	};
}

export const db = {
	collection(name: string) {
		void name;
		return {
			doc(id: string) {
				return makeDocRef(id);
			},
		};
	},
	async runTransaction<T>(
		fn: (transaction: {
			get: (
				ref: ReturnType<typeof makeDocRef>,
			) => ReturnType<ReturnType<typeof makeDocRef>["get"]>;
			update: (
				ref: ReturnType<typeof makeDocRef>,
				payload: Record<string, unknown>,
			) => Promise<void>;
		}) => Promise<T>,
	): Promise<T> {
		const transaction = {
			get(ref: ReturnType<typeof makeDocRef>) {
				return ref.get();
			},
			update(
				ref: ReturnType<typeof makeDocRef>,
				payload: Record<string, unknown>,
			) {
				return ref.update(payload);
			},
		};

		return fn(transaction);
	},
};

export const REPORTS_COLLECTION = "audit_reports";
