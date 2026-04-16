// ============================================
// Agency OS — Email Processing Utilities
// ============================================
import * as crypto from 'crypto';

const TRACKING_SECRET = process.env.NEXTAUTH_SECRET || 'agency-os-secret';

/**
 * Generate a secure HMAC token for unsubscribe links.
 * Prevents people from unsubscribing arbitrary emails.
 */
export function generateUnsubscribeToken(prospectId: string): string {
  return crypto
    .createHmac('sha256', TRACKING_SECRET)
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
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected),
  );
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
      const trackUrl = `${baseUrl}/api/track/click/${emailId}?url=${encodeURIComponent(url)}`;
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
