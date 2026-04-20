const SERVICE_WORKER_PATH = "/sw.js";

export type ServiceWorkerRegistrationResult =
  | { status: "unsupported"; registration: null }
  | { status: "registered"; registration: ServiceWorkerRegistration }
  | { status: "failed"; registration: null };

export async function registerServiceWorker(
  serviceWorker: ServiceWorkerContainer | undefined = typeof navigator !== "undefined"
    ? navigator.serviceWorker
    : undefined,
): Promise<ServiceWorkerRegistrationResult> {
  if (!serviceWorker) {
    return { status: "unsupported", registration: null };
  }

  try {
    const registration = await serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: "/",
    });
    return { status: "registered", registration };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[vertaflow:pwa] service worker registration failed", error);
    return { status: "failed", registration: null };
  }
}
