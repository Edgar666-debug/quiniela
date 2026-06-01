type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

type Bucket = { resetAtMs: number; count: number };

// Simple in-memory fixed window rate limiter.
// Note: In serverless/edge, memory is per-instance. Good enough to protect quota from accidental spam.
const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
  nowMs?: number;
}): RateLimitResult {
  const now = opts.nowMs ?? Date.now();
  const existing = buckets.get(opts.key);

  if (!existing || now >= existing.resetAtMs) {
    buckets.set(opts.key, { resetAtMs: now + opts.windowMs, count: 1 });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true };
}

export function getRequestIp(req: Request): string {
  // Vercel/CF set x-forwarded-for. We keep only the first hop.
  const raw = req.headers.get("x-forwarded-for") ?? "";
  const ip = raw.split(",")[0]?.trim();
  if (ip) return ip;
  return req.headers.get("x-real-ip") ?? "unknown";
}

