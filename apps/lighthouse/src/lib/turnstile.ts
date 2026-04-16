/**
 * Cloudflare Turnstile server-side token verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  success: boolean;
  errorCodes: string[];
}

/**
 * Verifies a Turnstile token against Cloudflare's siteverify API.
 *
 * @param token  The `cf-turnstile-response` token from the client.
 * @param ip     Optional client IP to forward for additional validation.
 * @returns      Verification result with success flag and any error codes.
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<TurnstileResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return { success: false, errorCodes: ['missing-secret-key'] };
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    };

    if (ip) {
      body.remoteip = ip;
    }

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      console.error(`Turnstile verify returned HTTP ${response.status}`);
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const data = await response.json();

    return {
      success: Boolean(data.success),
      errorCodes: Array.isArray(data['error-codes']) ? data['error-codes'] : [],
    };
  } catch (err) {
    console.error('Turnstile verification failed:', err instanceof Error ? err.message : err);
    return { success: false, errorCodes: ['network-error'] };
  }
}
