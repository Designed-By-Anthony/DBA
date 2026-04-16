"use client";

import { useCallback, useEffect, useState } from "react";

type CfDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

export default function DomainsClient() {
  const [records, setRecords] = useState<CfDnsRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("CNAME");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

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
          DNS records for your Cloudflare zone (POST / GET / DELETE via Agency OS). Set{" "}
          <code className="text-xs">CLOUDFLARE_API_TOKEN</code> and{" "}
          <code className="text-xs">CLOUDFLARE_ZONE_ID</code> in the server environment.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

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
