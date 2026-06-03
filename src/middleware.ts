import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_PATHS = ["/sign-in", "/sign-up"];

// Optimistic cookie check — NOT a security boundary.
// Full session validation happens in each page/route handler.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Redirect authenticated users away from auth pages
  if (sessionCookie && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign-in, preserving the destination
  if (!sessionCookie && !AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const next = pathname + request.nextUrl.search;
    return NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Better Auth API
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/cron).*)",
  ],
  runtime: "nodejs",
};
