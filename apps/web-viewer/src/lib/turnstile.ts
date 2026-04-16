/**
 * Cloudflare Turnstile server-side token verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { success: boolean; errorCodes: string[] };

export async function verifyTurnstileToken(token: string, ip?: string): Promise<TurnstileResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return { success: false, errorCodes: ["missing-secret-key"] };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const data = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

    return {
      success: Boolean(data.success),
      errorCodes: Array.isArray(data["error-codes"]) ? data["error-codes"] : [],
    };
  } catch {
    return { success: false, errorCodes: ["network-error"] };
  }
}
