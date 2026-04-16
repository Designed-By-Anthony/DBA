const LOCAL_ALLOWED_ORIGINS = new Set([
  'https://designedbyanthony.com',
  'https://www.designedbyanthony.com',
  'http://localhost:4322',
  'http://localhost:4321',
  'http://localhost:3000',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:3000',
]);

const localRateLimitBuckets = new Map<string, number[]>();

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getExtraAllowedOrigins(): Set<string> {
  const configured = process.env.ALLOWED_ORIGINS || '';
  return new Set(
    configured
      .split(',')
      .map((value) => normalizeOrigin(value.trim()))
      .filter((value): value is string => Boolean(value))
  );
}

function isAllowedOrigin(origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  if (LOCAL_ALLOWED_ORIGINS.has(normalizedOrigin)) {
    return true;
  }

  const url = new URL(normalizedOrigin);
  if (
    url.protocol === 'https:' &&
    (url.hostname === 'designedbyanthony.com' ||
      url.hostname.endsWith('.designedbyanthony.com'))
  ) {
    return true;
  }

  return getExtraAllowedOrigins().has(normalizedOrigin);
}

export function buildCorsHeaders(
  request: Request,
  methods: string,
  allowHeaders = 'Content-Type, Authorization'
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowHeaders,
    Vary: 'Origin',
  };

  const origin = request.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function getClientAddress(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Best-effort burst protection for public endpoints.
 * This is process-local, so it helps with accidental floods and basic abuse,
 * but it is not a substitute for edge or shared-store rate limiting.
 */
export function checkLocalRateLimit(
  key: string,
  limit: number,
  windowMs: number
): number | null {
  const now = Date.now();
  const existing = localRateLimitBuckets.get(key) || [];
  const recentHits = existing.filter((timestamp) => now - timestamp < windowMs);

  if (recentHits.length >= limit) {
    const retryAfterMs = windowMs - (now - recentHits[0]);
    localRateLimitBuckets.set(key, recentHits);
    return Math.max(1, Math.ceil(retryAfterMs / 1000));
  }

  recentHits.push(now);
  localRateLimitBuckets.set(key, recentHits);
  return null;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
