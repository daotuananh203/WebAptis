/** Small, dependency-free auth abuse guard. The key is IP + normalized email. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

function getBucket(key: string) {
  const now = Date.now();
  const current = failures.get(key);
  if (!current || current.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    failures.set(key, fresh);
    return fresh;
  }
  return current;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export function isAuthRateLimited(key: string): number | null {
  const bucket = getBucket(key);
  if (bucket.count < MAX_FAILURES) return null;
  return Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}

/** Returns Retry-After seconds when the failure crosses the limit. */
export function consumeAuthFailure(key: string): number | null {
  const bucket = getBucket(key);
  bucket.count += 1;
  if (bucket.count < MAX_FAILURES) return null;
  return Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000));
}

export function clearAuthFailures(key: string): void {
  failures.delete(key);
}
