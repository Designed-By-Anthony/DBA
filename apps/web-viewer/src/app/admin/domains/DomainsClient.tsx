"use client";

import { useCallback, useEffect, useState } from "react";

type CfDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

type CfCustomHostname = {
  id: string;
  hostname: string;
  status: string;
  created_at?: string;
  ssl?: { status?: string } | null;
  ownership_verification?: { name?: string; value?: string } | null;
};

export default function DomainsClient() {
  const [records, setRecords] = useState<CfDnsRecord[]>([]);
  const [hostnames, setHostnames] = useState<CfCustomHostname[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSaas, setLoadingSaas] = useState(true);
  const [type, setType] = useState("CNAME");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [hostname, setHostname] = useState("");
  const [savingSaas, setSavingSaas] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/domains", { credentials: "include" });
      const data = (await res.json()) as { records?: CfDnsRecord[]; error?: string };
      if (!res.ok) {
        setError(data.error || res.statusText);
        setRecords([]);
        return;
      }
      setRecords(data.records ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSaas = useCallback(async () => {
    setLoadingSaas(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/custom-hostnames", { credentials: "include" });
      const data = (await res.json()) as { hostnames?: CfCustomHostname[]; error?: string };
      if (!res.ok) {
        setError(data.error || res.statusText);
        setHostnames([]);
        return;
      }
      setHostnames(data.hostnames ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingSaas(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadSaas();
  }, [load, loadSaas]);

  async function addRecord(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: name.trim(), content: content.trim(), proxied: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Create failed");
        return;
      }
      setName("");
      setContent("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function addCustomHostname(e: React.FormEvent) {
    e.preventDefault();
    setSavingSaas(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/custom-hostnames", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: hostname.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Provision failed");
        return;
      }
      setHostname("");
      await loadSaas();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingSaas(false);
    }
  }

  async function removeCustomHostname(id: string) {
    if (!confirm("Delete this custom hostname?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/custom-hostnames?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Delete failed");
        return;
      }
      await loadSaas();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeRecord(id: string) {
    if (!confirm("Delete this DNS record?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/domains?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Delete failed");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Client domains</h1>
        <p className="mt-1 text-sm text-text-muted">
          Provision SaaS custom hostnames and manage zone DNS. Set{" "}
          <code className="text-xs">CLOUDFLARE_API_TOKEN</code> and{" "}
          <code className="text-xs">CLOUDFLARE_ZONE_ID</code> in the server environment.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={addCustomHostname}
        className="rounded-xl border border-glass-border bg-surface-1 p-4 space-y-3"
      >
        <h2 className="text-sm font-medium text-white">Cloudflare for SaaS: custom hostname</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-xs text-text-muted sm:col-span-3">
            Hostname
            <input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="client.designedbyanthony.com"
              className="mt-1 w-full rounded border border-glass-border bg-surface-2 px-2 py-2 text-sm text-white"
              required
            />
          </label>
          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={savingSaas}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {savingSaas ? "Provisioning…" : "Add domain"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-glass-border bg-surface-2/40 overflow-hidden">
          <div className="border-b border-glass-border px-4 py-3 flex items-center justify-between">
            <h3 className="text-xs font-medium text-white/90">Custom hostnames</h3>
            <button
              type="button"
              onClick={() => loadSaas()}
              className="text-xs text-blue-400 hover:underline"
            >
              Refresh
            </button>
          </div>
          {loadingSaas ? (
            <p className="p-4 text-sm text-text-muted">Loading…</p>
          ) : hostnames.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">No custom hostnames returned.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/50 text-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Hostname</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">SSL</th>
                  <th className="px-4 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {hostnames.map((h) => (
                  <tr key={h.id} className="border-t border-glass-border">
                    <td className="px-4 py-2 break-all">{h.hostname}</td>
                    <td className="px-4 py-2 font-mono text-xs text-text-muted">{h.status}</td>
                    <td className="px-4 py-2 font-mono text-xs text-text-muted">
                      {h.ssl?.status ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeCustomHostname(h.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </form>

      <form onSubmit={addRecord} className="rounded-xl border border-glass-border bg-surface-1 p-4 space-y-3">
        <h2 className="text-sm font-medium text-white">Add record</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-xs text-text-muted sm:col-span-1">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded border border-glass-border bg-surface-2 px-2 py-2 text-sm text-white"
            >
              {["A", "AAAA", "CNAME", "TXT", "MX"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-text-muted sm:col-span-1">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="client.example.com"
              className="mt-1 w-full rounded border border-glass-border bg-surface-2 px-2 py-2 text-sm text-white"
              required
            />
          </label>
          <label className="text-xs text-text-muted sm:col-span-2">
            Content / target
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="target.host.com"
              className="mt-1 w-full rounded border border-glass-border bg-surface-2 px-2 py-2 text-sm text-white"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create record"}
        </button>
      </form>

      <div className="rounded-xl border border-glass-border bg-surface-1 overflow-hidden">
        <div className="border-b border-glass-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Zone records</h2>
          <button
            type="button"
            onClick={() => load()}
            className="text-xs text-blue-400 hover:underline"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-text-muted">Loading…</p>
        ) : records.length === 0 ? (
          <p className="p-4 text-sm text-text-muted">No records returned (or Cloudflare not configured).</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2/50 text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Content</th>
                <th className="px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-glass-border">
                  <td className="px-4 py-2 font-mono text-xs">{r.type}</td>
                  <td className="px-4 py-2 break-all">{r.name}</td>
                  <td className="px-4 py-2 break-all text-text-muted">{r.content}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRecord(r.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
