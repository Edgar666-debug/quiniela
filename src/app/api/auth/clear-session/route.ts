import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Clears a stale/expired session cookie and redirects to sign-in.
 * Called when the session cookie exists but the session is no longer valid
 * in the database (expired, deleted, etc.). Without this, the proxy's
 * optimistic cookie check would cause an infinite redirect loop between
 * /sign-in and /dashboard.
 */
export async function GET(request: Request) {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Session may already be gone from DB — still need to clear the cookie.
    // better-auth / nextCookies() will handle the Set-Cookie response header.
  }

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next");

  redirect(next && next.startsWith("/") && !next.startsWith("//") ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
}
