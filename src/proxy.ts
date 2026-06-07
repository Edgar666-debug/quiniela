import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that are always accessible without a session
const AUTH_PREFIX_PATHS = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
const PUBLIC_EXACT_PATHS = ["/"];

// Optimistic cookie check — NOT a security boundary.
// Full session validation happens in each page/route handler.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isAuthPath = AUTH_PREFIX_PATHS.some((p) => pathname.startsWith(p));
  const isPublicPath = PUBLIC_EXACT_PATHS.includes(pathname);

  // Redirect authenticated users away from auth pages (not from landing)
  if (sessionCookie && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign-in, preserving the destination
  if (!sessionCookie && !isAuthPath && !isPublicPath) {
    const next = pathname + request.nextUrl.search;
    return NextResponse.redirect(
      new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match UI routes only. Route handlers validate auth/authorization themselves
    // and should return JSON 401/403 instead of HTML redirects.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
