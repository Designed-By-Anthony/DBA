const CF_API = "https://api.cloudflare.com/client/v4";

export type CfDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
};

export type CfCustomHostname = {
  id: string;
  hostname: string;
  status: string;
  created_at?: string;
  ownership_verification?: { type?: string; name?: string; value?: string } | null;
  ssl?: { status?: string; method?: string; type?: string } | null;
};

function headers(): HeadersInit {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function zoneId(): string {
  const z = process.env.CLOUDFLARE_ZONE_ID?.trim();
  if (!z) throw new Error("CLOUDFLARE_ZONE_ID is not set");
  return z;
}

export async function listDnsRecords(): Promise<CfDnsRecord[]> {
  const res = await fetch(
    `${CF_API}/zones/${zoneId()}/dns_records?per_page=100`,
    { headers: headers(), next: { revalidate: 0 } },
  );
  const json = (await res.json()) as {
    success: boolean;
    result?: CfDnsRecord[];
    errors?: { message: string }[];
  };
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "Cloudflare list failed");
  }
  return json.result ?? [];
}

export async function createDnsRecord(body: {
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
}): Promise<CfDnsRecord> {
  const res = await fetch(`${CF_API}/zones/${zoneId()}/dns_records`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    success: boolean;
    result?: CfDnsRecord;
    errors?: { message: string }[];
  };
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "Cloudflare create failed");
  }
  if (!json.result) throw new Error("Cloudflare returned no result");
  return json.result;
}

export async function deleteDnsRecord(recordId: string): Promise<void> {
  const res = await fetch(
    `${CF_API}/zones/${zoneId()}/dns_records/${encodeURIComponent(recordId)}`,
    { method: "DELETE", headers: headers() },
  );
  const json = (await res.json()) as {
    success: boolean;
    errors?: { message: string }[];
  };
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "Cloudflare delete failed");
  }
}

export async function listCustomHostnames(): Promise<CfCustomHostname[]> {
  const res = await fetch(
    `${CF_API}/zones/${zoneId()}/custom_hostnames?per_page=100`,
    { headers: headers(), next: { revalidate: 0 } },
  );
  const json = (await res.json()) as {
    success: boolean;
    result?: CfCustomHostname[];
    errors?: { message: string }[];
  };
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "Cloudflare list custom hostnames failed");
  }
  return json.result ?? [];
}

export async function createCustomHostname(body: {
  hostname: string;
}): Promise<CfCustomHostname> {
  const res = await fetch(`${CF_API}/zones/${zoneId()}/custom_hostnames`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      hostname: body.hostname,
      ssl: { method: "http", type: "dv" },
    }),
  });
  const json = (await res.json()) as {
    success: boolean;
    result?: CfCustomHostname;
    errors?: { message: string }[];
  };
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "Cloudflare create custom hostname failed");
  }
  if (!json.result) throw new Error("Cloudflare returned no result");
  return json.result;
}

export async function deleteCustomHostname(id: string): Promise<void> {
  const res = await fetch(
    `${CF_API}/zones/${zoneId()}/custom_hostnames/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: headers() },
  );
  const json = (await res.json()) as {
    success: boolean;
    errors?: { message: string }[];
  };
  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "Cloudflare delete custom hostname failed");
  }
}

export function isCloudflareConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_API_TOKEN?.trim() &&
      process.env.CLOUDFLARE_ZONE_ID?.trim(),
  );
}
