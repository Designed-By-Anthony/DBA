"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock3, Copy, RefreshCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { TenantDomainRow } from "@dba/database";
import {
  onboardTenantDomainAction,
  refreshTenantDomainStatusAction,
} from "@/app/actions/tenant-onboarding";
import { groupDnsInstructions } from "@/lib/utils/dns-templates";

type Props = {
  initialDomains: TenantDomainRow[];
  loadError?: string;
};

function statusClass(status: string) {
  if (status === "verified") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "failed") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (status === "temporary_failure") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-sky-500/30 bg-sky-500/10 text-sky-300";
}

function prettyStatus(status: string) {
  return status.replace(/_/g, " ");
}

function DomainRecordsTable({ domain }: { domain: TenantDomainRow }) {
  const groups = useMemo(
    () => groupDnsInstructions(domain.domainName, domain.records),
    [domain.domainName, domain.records],
  );

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.id} className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{group.label}</h3>
              <p className="text-xs text-text-muted">{group.description}</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-glass-border">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-surface-2 text-text-muted uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">TTL</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {group.records.map((record) => (
                  <tr key={`${group.id}-${record.type}-${record.name}-${record.value}`}>
                    <td className="px-3 py-3 text-white">{record.type}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-sky-100">{record.name}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(record.value);
                          toast.success("Record value copied");
                        }}
                        className="group flex max-w-[360px] items-center gap-2 text-left font-mono text-[11px] text-white hover:text-(--color-brand)"
                      >
                        <span className="truncate">{record.value}</span>
                        <Copy size={13} className="shrink-0 opacity-50 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-text-muted">{record.ttl || "Auto"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded px-2 py-1 ${statusClass(record.status || "pending")}`}>
                        {prettyStatus(record.status || "pending")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

export default function DomainSettingsClient({ initialDomains, loadError }: Props) {
  const [domains, setDomains] = useState(initialDomains);
  const [domainName, setDomainName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const primaryDomain = domains[0] ?? null;

  const submitDomain = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = domainName.trim().toLowerCase();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await onboardTenantDomainAction({ domainName: trimmed });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setDomains((current) => {
        const rest = current.filter((item) => item.id !== result.domain.id);
        return [result.domain, ...rest];
      });
      setDomainName("");
      toast.success("Domain registered. Add the DNS records next.");
      if (result.warning) toast.warning(result.warning);
    });
  };

  const refreshDomain = (domainId: string) => {
    setPendingId(domainId);
    startTransition(async () => {
      const result = await refreshTenantDomainStatusAction(domainId);
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setDomains((current) =>
        current.map((item) => (item.id === result.domain.id ? result.domain : item)),
      );
      toast.success(
        result.domain.status === "verified"
          ? "Domain verified. Anthony has been notified."
          : "Domain status refreshed.",
      );
      if (result.warning) toast.warning(result.warning);
    });
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
            Email reputation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Domain Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Connect a client domain, install the DNS records, then check verification before sending.
          </p>
        </div>
        {primaryDomain && (
          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${statusClass(primaryDomain.status)}`}>
            {primaryDomain.status === "verified" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
            {primaryDomain.domainName} is {prettyStatus(primaryDomain.status)}
          </div>
        )}
      </div>

      <form onSubmit={submitDomain} className="space-y-3 rounded-lg border border-glass-border bg-surface-1/70 p-4">
        <label className="text-sm font-medium text-white" htmlFor="domainName">
          Add sending domain
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="domainName"
            name="domainName"
            value={domainName}
            onChange={(event) => setDomainName(event.target.value)}
            placeholder="client.com"
            className="min-h-11 flex-1 rounded-lg border border-glass-border bg-surface-2 px-4 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-(--color-brand)"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-(--color-brand) px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {isPending ? "Registering..." : "Register Domain"}
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Use the root domain. DNS hosts usually want the name/value pairs exactly as shown below.
        </p>
      </form>

      {loadError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {loadError}
        </div>
      )}

      {domains.length === 0 ? (
        <div className="rounded-lg border border-dashed border-glass-border p-10 text-center">
          <p className="text-sm text-white">No domains yet.</p>
          <p className="mt-1 text-xs text-text-muted">Register a domain to generate SPF, DKIM, and DMARC instructions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {domains.map((domain) => (
            <article key={domain.id} className="space-y-4 rounded-lg border border-glass-border bg-surface-1/70 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{domain.domainName}</h2>
                  <p className="text-xs text-text-muted">
                    Resend ID: <span className="font-mono">{domain.resendId}</span>
                    {domain.lastCheckedAt ? ` · Checked ${new Date(domain.lastCheckedAt).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-lg border px-3 py-2 text-xs ${statusClass(domain.status)}`}>
                    {prettyStatus(domain.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => refreshDomain(domain.id)}
                    disabled={pendingId === domain.id || isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-glass-border bg-surface-2 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-surface-3 disabled:opacity-50"
                  >
                    <RefreshCcw size={14} className={pendingId === domain.id ? "animate-spin" : ""} />
                    Check Status
                  </button>
                </div>
              </div>
              <DomainRecordsTable domain={domain} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
