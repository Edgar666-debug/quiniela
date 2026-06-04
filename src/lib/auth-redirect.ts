/** Safe internal path for post-login redirects (blocks open redirects). */
export function resolveAuthRedirect(next?: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}
