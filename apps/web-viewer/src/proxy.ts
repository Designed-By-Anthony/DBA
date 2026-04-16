import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

/** Align with `admin/layout.tsx`: admin is only Clerk-gated in production. */
function shouldProtectAdmin() {
  return process.env.NODE_ENV === 'production'
}

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl
  const hostname = req.headers.get('host') || ''

  // ── Production Subdomain Routing ──────────────────────
  //
  // app.designedbyanthony.com    → Admin CRM dashboard (rewrites to /admin/*)
  // portal.designedbyanthony.com → Client portal (rewrites to /portal/*)
  // admin.designedbyanthony.com  → Legacy alias for app.* (backward compat)
  //
  // In dev, direct /admin and /portal paths work without subdomains.
  // ──────────────────────────────────────────────────────

  // ── App subdomain (admin CRM) ──
  const isAppDomain =
    hostname.startsWith('app.') ||
    hostname.startsWith('admin.') ||
    hostname.startsWith('admin-') ||
    hostname.startsWith('app-')

  if (isAppDomain) {
    // Inbound webhooks must stay public (no Clerk session). Never point the marketing form at
    // app.* for /api/webhooks/* — use viewer.* or apex — but if someone does, don't 401 the hook.
    const isInboundWebhook = url.pathname.startsWith('/api/webhooks/')
    if (!isInboundWebhook && shouldProtectAdmin()) {
      await auth.protect()
    }

    // PAY GATE PREVIEW: 
    // In production, you would check session.sessionClaims?.publicMetadata?.isSubscribed
    // For now we set this mock toggle. Change to true to preview the lock screen.
    const FORCE_UPGRADE_PREVIEW = false
    
    if (FORCE_UPGRADE_PREVIEW) {
      if (!url.pathname.startsWith('/admin/billing/upgrade') && !url.pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/admin/billing/upgrade', req.url))
      }
    }

    // Don't double-rewrite paths that already start with /admin
    // Also skip API routes, _next, and static files
    if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api/')) {
      const rewrittenPath = `/admin${url.pathname}`
      return NextResponse.rewrite(new URL(rewrittenPath, req.url))
    }

    return NextResponse.next()
  }

  // ── Portal subdomain (client portal) ──
  const isPortalDomain =
    hostname.startsWith('portal.') ||
    hostname.startsWith('portal-')

  if (isPortalDomain) {
    // Portal is public (magic link auth, no Clerk gate)
    // Don't double-rewrite paths that already start with /portal
    if (!url.pathname.startsWith('/portal') && !url.pathname.startsWith('/api/')) {
      const rewrittenPath = `/portal${url.pathname}`
      return NextResponse.rewrite(new URL(rewrittenPath, req.url))
    }

    return NextResponse.next()
  }

  // ── Non-subdomain routes: Clerk gate for /admin in production only ──
  // (localhost / Playwright use NODE_ENV development|test — same bypass as admin/layout.tsx)
  if (isAdminRoute(req) && shouldProtectAdmin()) {
    await auth.protect()
  }

  // ── Preview subdomain proxy ──
  const isPreviewDomain = hostname.includes('.preview.designedbyanthony.com') || 
                          (hostname.includes('.localhost') && !hostname.startsWith('www.'))

  if (isPreviewDomain) {
    const subdomain = hostname.split('.')[0]
    if (!url.pathname.startsWith('/preview/')) {
      return NextResponse.rewrite(new URL(`/preview/${subdomain}${url.pathname === '/' ? '' : url.pathname}`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
