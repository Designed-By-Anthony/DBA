const SERVICE_WORKER_PATH = "/sw.js";

export type ServiceWorkerRegistrationResult =
	| { status: "unsupported"; registration: null }
	| { status: "registered"; registration: ServiceWorkerRegistration }
	| { status: "failed"; registration: null };

export type RegisterServiceWorkerOptions = {
	/** Override container (tests inject a mock). Defaults to `navigator.serviceWorker`. */
	serviceWorker?: ServiceWorkerContainer;
	onFailure?: (error: unknown) => void;
};

export async function registerServiceWorker(
	serviceWorker: ServiceWorkerContainer | undefined = typeof navigator !==
	"undefined"
		? navigator.serviceWorker
		: undefined,
	options?: RegisterServiceWorkerOptions,
): Promise<ServiceWorkerRegistrationResult> {
	const container = options?.serviceWorker ?? serviceWorker;

	if (!container?.register) {
		return { status: "unsupported", registration: null };
	}

	try {
		const registration = await container.register(SERVICE_WORKER_PATH, {
			scope: "/",
		});
		return { status: "registered", registration };
	} catch (error) {
		options?.onFailure?.(error);
		// eslint-disable-next-line no-console
		console.error("[vertaflow:pwa] service worker registration failed", error);
		return { status: "failed", registration: null };
	}
}
