import { env } from "@/lib/env";
import { signSupabaseJwt } from "@/lib/supabase/jwt";

export function createSupabaseRealtimeToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  return signSupabaseJwt(
    {
      aud: "authenticated",
      role: "authenticated",
      sub: userId,
      iat: now,
      exp: now + 60 * 10,
    },
    env.SUPABASE_JWT_SECRET,
  );
}
