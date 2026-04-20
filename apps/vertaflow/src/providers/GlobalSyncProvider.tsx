import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { syncPendingRecords } from "../lib/sync";

type GlobalSyncState = {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
};

const GlobalSyncContext = createContext<GlobalSyncState | undefined>(undefined);

export function GlobalSyncProvider({ children }: PropsWithChildren) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const syncNow = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    setIsSyncing(true);
    const syncPromise = syncPendingRecords()
      .then(() => {
        setLastSyncedAt(new Date().toISOString());
      })
      .finally(() => {
        inFlightRef.current = null;
        setIsSyncing(false);
      });

    inFlightRef.current = syncPromise;
    await syncPromise;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncNow();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow]);

  const value = useMemo<GlobalSyncState>(
    () => ({
      isOnline,
      isSyncing,
      lastSyncedAt,
      syncNow,
    }),
    [isOnline, isSyncing, lastSyncedAt, syncNow]
  );

  return <GlobalSyncContext.Provider value={value}>{children}</GlobalSyncContext.Provider>;
}

export function useGlobalSync() {
  const context = useContext(GlobalSyncContext);
  if (!context) {
    throw new Error("useGlobalSync must be used within GlobalSyncProvider");
  }
  return context;
}

export function installGlobalSyncProvider(): () => void {
  const syncWhenOnline = async () => {
    if (!navigator.onLine) return;
    await syncPendingRecords();
  };

  const handleOnline = () => {
    void syncWhenOnline();
  };

  window.addEventListener("online", handleOnline);
  void syncWhenOnline();

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
