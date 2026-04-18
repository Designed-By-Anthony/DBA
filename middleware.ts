/**
 * Root Vercel Edge Middleware — host-based routing for
 * Designed by Anthony ("Chameleon" multi-app gateway).
 *
 * Vercel runs this file at the edge for every request to the apex
 * Vercel project (the Astro marketing deployment). Depending on the
 * Host header we either let the request fall through to the Astro site
 * or rewrite it to the upstream URL of another Vercel project.
 *
 * Deploy model (see `ANTHONYS_INSTRUCTIONS.txt`):
 *   - apps/marketing  — deployed as a standalone Vercel project; also
 *     serves this middleware. Hostname: designedbyanthony.com.
 *   - apps/web-viewer — deployed as a separate Vercel project; the
 *     admin and accounts surfaces both live here. Hostname:
 *     $ADMIN_UPSTREAM_URL / $ACCOUNTS_UPSTREAM_URL.
 *   - apps/lighthouse — deployed as its own Vercel project. Hostname:
 *     $LIGHTHOUSE_UPSTREAM_URL (subdomain routing optional).
 *
 * Why a root middleware instead of vercel.json `rewrites`?
 *   - vercel.json rewrites run *before* middleware and are static; a
 *     TypeScript middleware lets the "Chameleon" rules evolve (A/B
 *     tests, tenant skins, feature flags) without a redeploy of the
 *     config layer.
 *   - Keeping the rules in TS also means our type-checker catches
 *     mistakes (undefined env vars, bad URL shapes).
 *
 * Reference: https://vercel.com/docs/functions/edge-middleware
 */
import { next, rewrite, type RequestContext } from '@vercel/edge';

const APEX_DOMAIN = 'designedbyanthony.com';

const ADMIN_HOST = `admin.${APEX_DOMAIN}`;
const ACCOUNTS_HOST = `accounts.${APEX_DOMAIN}`;
const LIGHTHOUSE_HOST = `lighthouse.${APEX_DOMAIN}`;

/**
 * Matcher — skip Vercel plumbing and static asset paths so we never
 * rewrite an asset request for the wrong upstream. Everything else goes
 * through host-based routing.
 */
export const config = {
  matcher: ['/((?!_vercel|brand/|scripts/|fonts/|images/|assets/|sitemap|robots\\.txt).*)'],
};

function hostnameOf(request: Request): string {
  const raw = request.headers.get('host') ?? '';
  // Strip the port (e.g. :3000) for local dev, lowercase for safety.
  return raw.split(':')[0]!.toLowerCase();
}

function buildUpstream(
  upstreamBase: string,
  pathname: string,
  search: string,
  pathPrefix = '',
): URL {
  const base = upstreamBase.replace(/\/$/, '');
  const joinedPath = `${pathPrefix}${pathname}`.replace(/\/{2,}/g, '/');
  return new URL(`${joinedPath}${search}`, base);
}

/**
 * In production the apex Vercel project OWNS the canonical subdomains
 * (admin / accounts / lighthouse) via the Chameleon middleware. If an
 * upstream env var is missing we MUST NOT fall through to `next()` —
 * that silently serves the Astro marketing homepage from admin.* /
 * accounts.* / lighthouse.*, which is the exact regression this guard
 * prevents. Return a loud 502 instead so the misconfig is visible.
 *
 * Preview + local dev (`VERCEL_ENV !== 'production'`) keep the
 * fallthrough so unconfigured preview URLs still render something.
 */
function misconfigured(hostLabel: string): Response {
  const body = `Upstream for ${hostLabel}.${APEX_DOMAIN} is not configured. Set ${hostLabel.toUpperCase()}_UPSTREAM_URL on the apex Vercel project.`;
  return new Response(body, {
    status: 502,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Cross-project Vercel rewrites present the upstream deployment's own
 * hostname to the downstream app (the origin `admin.` / `accounts.` host
 * is only visible via `x-forwarded-host`). So the web-viewer `proxy.ts`
 * host-based `/admin` + `/portal` prefixing does NOT fire in production
 * — it only runs on `*.localhost` during local dev. The apex gateway
 * therefore has to pre-prefix the path itself, otherwise:
 *   - `admin.<apex>/`     → serves the public root landing (wrong page)
 *   - `accounts.<apex>/`  → 404 (no `/accounts` route exists)
 *
 * `/api/...` paths are pass-through because the web-viewer API routes
 * live at `/api/*` (not `/admin/api/*` or `/portal/api/*`).
 */
function needsAppPrefix(pathname: string, prefix: string): boolean {
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return false;
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/_next/')) return false;
  if (pathname === '/manifest.webmanifest') return false;
  if (pathname.startsWith('/favicon.')) return false;
  return true;
}

export default function middleware(request: Request, _ctx: RequestContext) {
  const host = hostnameOf(request);
  const url = new URL(request.url);
  const { pathname, search } = url;

  if (host === ADMIN_HOST) {
    const upstream = process.env.ADMIN_UPSTREAM_URL;
    if (!upstream) return isProduction() ? misconfigured('admin') : next();
    // Admin dashboard lives under /admin in web-viewer; /api/* is a sibling.
    const prefix = needsAppPrefix(pathname, '/admin') ? '/admin' : '';
    return rewrite(buildUpstream(upstream, pathname, search, prefix));
  }

  if (host === ACCOUNTS_HOST) {
    const upstream =
      process.env.ACCOUNTS_UPSTREAM_URL ?? process.env.ADMIN_UPSTREAM_URL;
    if (!upstream) return isProduction() ? misconfigured('accounts') : next();
    // The "accounts" subdomain is the client portal surface of web-viewer,
    // which is implemented under /portal. Keep /api/* un-prefixed so
    // `accounts.designedbyanthony.com/api/portal/branding` still resolves.
    const prefix = needsAppPrefix(pathname, '/portal') ? '/portal' : '';
    return rewrite(buildUpstream(upstream, pathname, search, prefix));
  }

  if (host === LIGHTHOUSE_HOST) {
    const upstream = process.env.LIGHTHOUSE_UPSTREAM_URL;
    if (!upstream) return isProduction() ? misconfigured('lighthouse') : next();
    return rewrite(buildUpstream(upstream, pathname, search));
  }

  // Apex + www + previews → fall through to Astro marketing site.
  const res = next();
  
  // Apply security headers for the marketing site
  res.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "base-uri 'self'; " +
    "object-src 'none'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://challenges.cloudflare.com https://www.googletagmanager.com https://vercel.live; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://images.unsplash.com https://american-operator-assets-public.s3.us-east-1.amazonaws.com https://astro.badg.es; " +
    "connect-src 'self' https://*.designedbyanthony.com https://api.stripe.com https://www.google-analytics.com wss://ws-mt1.pusher.com; " +
    "frame-src 'self' https://js.stripe.com https://www.google.com/recaptcha/ https://challenges.cloudflare.com; " +
    "worker-src 'self' blob:; " +
    "frame-ancestors 'none';"
  );
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), usb=()');
  
  return res;
}
