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

function applyPatch(target: StoredReport, patch: Record<string, unknown>): StoredReport {
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
        const err = new Error("already exists") as Error & { code?: number | string };
        err.code = "already-exists";
        throw err;
      }
      REPORTS.set(id, payload);
    },
    async get() {
      const data = REPORTS.get(id);
      return {
        exists: Boolean(data),
        data: () => data,
      };
    },
    async update(payload: Record<string, unknown>) {
      const existing = REPORTS.get(id);
      if (!existing) {
        throw new Error("not found");
      }
      REPORTS.set(id, applyPatch(existing, payload));
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
      get: (ref: ReturnType<typeof makeDocRef>) => ReturnType<ReturnType<typeof makeDocRef>["get"]>;
      update: (ref: ReturnType<typeof makeDocRef>, payload: Record<string, unknown>) => Promise<void>;
    }) => Promise<T>,
  ): Promise<T> {
    const transaction = {
      get(ref: ReturnType<typeof makeDocRef>) {
        return ref.get();
      },
      update(ref: ReturnType<typeof makeDocRef>, payload: Record<string, unknown>) {
        return ref.update(payload);
      },
    };

    return fn(transaction);
  },
};

export const REPORTS_COLLECTION = "audit_reports";
