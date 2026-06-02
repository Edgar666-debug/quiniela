import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { signSupabaseJwt } from "@/lib/supabase/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Math.floor(Date.now() / 1000);
  const token = signSupabaseJwt(
    {
      aud: "authenticated",
      role: "authenticated",
      sub: session.user.id,
      iat: now,
      exp: now + 60 * 10,
    },
    env.SUPABASE_JWT_SECRET,
  );

  return NextResponse.json({ token });
}

