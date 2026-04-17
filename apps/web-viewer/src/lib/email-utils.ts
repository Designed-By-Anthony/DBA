// ============================================
// Agency OS — Email Processing Utilities
// ============================================
import * as crypto from 'crypto';

/**
 * Secret used to HMAC-sign outbound tracking links (click + unsubscribe).
 *
 * Reads `EMAIL_LINK_SIGNING_SECRET` first. Falls back to `NEXTAUTH_SECRET`
 * for backward-compat with emails already sent by older builds. There is
 * **no** string fallback: if neither env var is set in a production build,
 * the tracking/unsubscribe helpers throw at call time so that we never ship
 * mail signed with a known-constant value (the previous default literal
 * `'agency-os-secret'` made every link forgeable by anyone reading the source).
 */
function getEmailLinkSecret(): string {
  const v = process.env.EMAIL_LINK_SIGNING_SECRET || process.env.NEXTAUTH_SECRET;
  if (!v || v.length === 0) {
    throw new Error(
      'Email link signing secret is not configured. Set EMAIL_LINK_SIGNING_SECRET (preferred) or NEXTAUTH_SECRET.',
    );
  }
  return v;
}

/**
 * HMAC signature for a click-tracking URL, bound to both the emailId and the
 * destination URL. First 32 hex chars are plenty for a tamper check; the full
 * 64-hex output is retained for the unsubscribe flow to preserve backward
 * compatibility with previously generated tokens.
 */
export function signClickTarget(emailId: string, targetUrl: string): string {
  return crypto
    .createHmac('sha256', getEmailLinkSecret())
    .update(`${emailId}|${targetUrl}`)
    .digest('hex')
    .slice(0, 32);
}

/** Constant-time verification of a click-tracking signature. */
export function verifyClickSignature(
  emailId: string,
  targetUrl: string,
  sig: string,
): boolean {
  const expected = signClickTarget(emailId, targetUrl);
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Generate a secure HMAC token for unsubscribe links.
 * Prevents people from unsubscribing arbitrary emails.
 */
export function generateUnsubscribeToken(prospectId: string): string {
  return crypto
    .createHmac('sha256', getEmailLinkSecret())
    .update(prospectId)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Verify an unsubscribe token
 */
export function verifyUnsubscribeToken(
  prospectId: string,
  token: string,
): boolean {
  const expected = generateUnsubscribeToken(prospectId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Rewrite all <a href="..."> links in HTML to route through our click tracker.
 * Preserves mailto: links and anchor links.
 */
export function wrapLinksForTracking(
  html: string,
  emailId: string,
  baseUrl: string,
): string {
  // Match href="..." in anchor tags
  return html.replace(
    /(<a\s[^>]*href=["'])([^"']+)(["'][^>]*>)/gi,
    (match, prefix, url, suffix) => {
      // Don't wrap mailto:, tel:, anchor, or already-tracked links
      if (
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('#') ||
        url.includes('/api/track/') ||
        url.includes('/api/unsubscribe')
      ) {
        return match;
      }
      const sig = signClickTarget(emailId, url);
      const trackUrl = `${baseUrl}/api/track/click/${emailId}?url=${encodeURIComponent(url)}&sig=${sig}`;
      return `${prefix}${trackUrl}${suffix}`;
    },
  );
}

/**
 * Append CAN-SPAM compliant footer to the email HTML.
 */
export function appendComplianceFooter(
  html: string,
  prospectId: string,
  baseUrl: string,
  companyName: string,
  physicalAddress: string,
): string {
  const token = generateUnsubscribeToken(prospectId);
  const unsubUrl = `${baseUrl}/api/unsubscribe?id=${prospectId}&token=${token}`;

  const footer = `
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#999;line-height:1.6;">
      <p style="margin:0 0 8px 0;">This is a commercial message from <strong>${companyName}</strong>.</p>
      <p style="margin:0 0 8px 0;">${physicalAddress.replace(/\\n/g, '<br/>')}</p>
      <p style="margin:0;">
        Don't want to receive these emails?
        <a href="${unsubUrl}" style="color:#6366f1;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  `;

  // Insert before closing body tag, or append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${footer}</body>`);
  }
  return html + footer;
}

/**
 * Inject a 1x1 tracking pixel before the closing </body> or at the end.
 */
export function injectTrackingPixel(
  html: string,
  emailId: string,
  baseUrl: string,
): string {
  const pixel = `<img src="${baseUrl}/api/track/open/${emailId}" width="1" height="1" alt="" style="display:none;border:0;" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
}

/**
 * Merge template variables into email body.
 * Replaces {{name}}, {{company}}, {{website}} etc.
 */
export function mergeTemplateVars(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
