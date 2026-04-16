import { withSentryConfig } from "@sentry/nextjs";
import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Native `pg` driver — avoid bundling issues in the server graph. */
  serverExternalPackages: ['pg'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Clerk FAPI (*.clerk.accounts.dev), telemetry, img, workers — see https://clerk.com/docs/security/clerk-csp
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://*.clerk.accounts.dev https://challenges.cloudflare.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https://images.unsplash.com https://qr-code-generator.com https://img.clerk.com; " +
              "connect-src 'self' https://*.firestore.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://api.stripe.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.clerk-telemetry.com; " +
              "frame-src 'self' https://js.stripe.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com https://*.clerk.accounts.dev; " +
              "worker-src 'self' blob:;",
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ],
      },
    ];
  },
};

/** Turbopack-friendly PWA: route handler at app/serwist/[path], worker bundled via esbuild (see Serwist docs). */
export default withSentryConfig(withSerwist(nextConfig), {
  org: "designed-by-anthony",
  project: "web-viewer",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
