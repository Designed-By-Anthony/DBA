const SERVICE_WORKER_HOSTS = new Set([
  "admin.vertaflow.io",
  "accounts.vertaflow.io",
  "dba-agency-os.vercel.app",
  "localhost",
  "127.0.0.1",
]);

export function isServiceWorkerHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  return SERVICE_WORKER_HOSTS.has(host) || host.endsWith(".localhost");
}

export function shouldRegisterServiceWorker(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (typeof window === "undefined") return false;

  return isServiceWorkerHost(window.location.hostname);
}
