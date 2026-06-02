import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createSupabaseRealtimeToken } from "@/lib/supabase/realtime-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = createSupabaseRealtimeToken(session.user.id);

  return NextResponse.json({ token });
}

