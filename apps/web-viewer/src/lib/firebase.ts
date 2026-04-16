type AnyRecord = any;

type QuerySnapshotShim = {
  empty: boolean;
  docs: Array<{
    id: string;
    data: () => AnyRecord;
    ref: DocRefShim;
  }>;
};

type DocSnapshotShim = {
  id: string;
  exists: boolean;
  data: () => AnyRecord | undefined;
  ref: DocRefShim;
};

type DocRefShim = {
  id: string;
  get: () => Promise<DocSnapshotShim>;
  set: (data: AnyRecord, _options?: AnyRecord) => Promise<void>;
  update: (data: AnyRecord) => Promise<void>;
  delete: () => Promise<void>;
  collection: (name: string) => CollectionRefShim;
};

type CollectionRefShim = {
  doc: (id?: string) => DocRefShim;
  where: (_field: string, _op: string, _value: unknown) => CollectionRefShim;
  orderBy: (_field: string, _direction?: "asc" | "desc") => CollectionRefShim;
  limit: (_count: number) => CollectionRefShim;
  select: (..._fields: string[]) => CollectionRefShim;
  count: () => {
    get: () => Promise<{
      data: () => { count: number };
    }>;
  };
  get: () => Promise<QuerySnapshotShim>;
  add: (data: AnyRecord) => Promise<{ id: string }>;
};

type WriteBatchShim = {
  delete: (_ref: { id: string }) => void;
  update: (_ref: { id: string }, _data: AnyRecord) => void;
  commit: () => Promise<void>;
};

function buildDocRef(path: string): DocRefShim {
  const id = path.split("/").at(-1) || "";
  const ref: DocRefShim = {
    id,
    async get() {
      return { id, exists: false, data: () => undefined, ref };
    },
    async set() {
      // no-op in shim mode
    },
    async update() {
      // no-op in shim mode
    },
    async delete() {
      // no-op in shim mode
    },
    collection(name: string) {
      return buildCollectionRef(`${path}/${name}`);
    },
  };
  return ref;
}

function buildCollectionRef(path: string): CollectionRefShim {
  return {
    doc(id?: string) {
      const resolvedId = id || `doc_${Date.now()}`;
      return buildDocRef(`${path}/${resolvedId}`);
    },
    where() {
      return this;
    },
    orderBy() {
      return this;
    },
    limit() {
      return this;
    },
    select() {
      return this;
    },
    count() {
      return {
        async get() {
          return {
            data: () => ({ count: 0 }),
          };
        },
      };
    },
    async get() {
      return { empty: true, docs: [] };
    },
    async add() {
      return { id: `doc_${Date.now()}` };
    },
  };
}

export const db = {
  collection(name: string) {
    return buildCollectionRef(name);
  },
  collectionGroup(name: string) {
    return buildCollectionRef(name);
  },
  batch(): WriteBatchShim {
    return {
      delete() {
        // no-op
      },
      update() {
        // no-op
      },
      async commit() {
        // no-op
      },
    };
  },
};

declare global {
  namespace FirebaseFirestore {
    type DocumentData = any;

    type Query = {
      where: (field: string, op: string, value: unknown) => Query;
      orderBy: (field: string, direction?: "asc" | "desc") => Query;
      limit: (count: number) => Query;
      select: (...fields: string[]) => Query;
      get: () => Promise<QuerySnapshot>;
    };

    type QueryDocumentSnapshot = {
      id: string;
      data: () => DocumentData;
      ref: {
        id: string;
        update: (data: Record<string, unknown>) => Promise<void>;
        delete: () => Promise<void>;
      };
    };

    type QuerySnapshot = {
      empty: boolean;
      docs: QueryDocumentSnapshot[];
    };
  }
}
