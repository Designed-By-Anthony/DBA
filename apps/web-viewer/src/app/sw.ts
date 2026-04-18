import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

/**
 * Serwist `defaultCache` treats any `.js` URL as cacheable (StaleWhileRevalidate).
 * That includes Clerk's frontend API scripts on `clerk.*` hosts; caching + SW fetch
 * handling was breaking Clerk JS with `no-response` / ERR_FAILED. Bypass the SW for
 * those origins so the browser loads them directly.
 */
const clerkCdnBypass: RuntimeCaching[] = [
  {
    matcher: /^https:\/\/clerk\.designedbyanthony\.com\//i,
    handler: new NetworkOnly(),
  },
  {
    matcher: /^https:\/\/[^/]+\.clerk\.accounts\.dev\//i,
    handler: new NetworkOnly(),
  },
];

// Tell TypeScript about the serwist injection point
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [...clerkCdnBypass, ...defaultCache],

  // Offline fallback: show /offline when any navigation request fails
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Handle push notifications from FCM
// @ts-expect-error — PushEvent requires WebWorker lib types
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() as {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
  } | undefined;

  const title = data?.title ?? "Designed by Anthony";
  const options: NotificationOptions = {
    body: data?.body ?? "You have a new update.",
    icon: data?.icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data?.url ?? "/portal/dashboard" },
    tag: "dba-notification",
    // @ts-expect-error — renotify is valid in SW NotificationOptions
    renotify: true,
  };

  // @ts-expect-error — self.registration requires WebWorker lib types
  event.waitUntil(self.registration.showNotification(title, options));
});

// Open the portal when a notification is clicked
// @ts-expect-error — NotificationEvent requires WebWorker lib types
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data as { url: string })?.url ?? "/portal/dashboard";
  event.waitUntil(
    // @ts-expect-error — self.clients requires ServiceWorkerGlobalScope
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: readonly { url: string; focus?: () => Promise<unknown> }[]) => {
      for (const client of clientList) {
        if (client.url.includes("/portal") && "focus" in client) {
          return client.focus!();
        }
      }
      // @ts-expect-error — self.clients requires ServiceWorkerGlobalScope
      return self.clients.openWindow(url);
    })
  );
});
