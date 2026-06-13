import { createHmac, timingSafeEqual } from "crypto";

import { env } from "@/lib/env";

const TOKEN_TTL_MS = 30 * 60_000;

function signPayload(payload: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(payload).digest("base64url");
}

export function createWidgetAccessToken(userId: string, nowMs = Date.now()): string {
  const exp = nowMs + TOKEN_TTL_MS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyWidgetAccessToken(token: string, nowMs = Date.now()): { ok: true; userId: string } | { ok: false } {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false };

  const userId = parts[0];
  const exp = Number(parts[1]);
  const sig = parts[2];

  if (!userId || !Number.isFinite(exp) || !sig) return { ok: false };
  if (nowMs > exp) return { ok: false };

  const payload = `${userId}.${exp}`;
  const expected = signPayload(payload);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }

  return { ok: true, userId };
}
