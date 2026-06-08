export type NavCrumb = { label: string; href?: string };

export function buildAppCrumbs(pathname: string, tournamentName: string | null, tournamentId: string | null): NavCrumb[] {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  if (pathname === "/tournaments") return [{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos" }];
  if (pathname === "/tournaments/new")
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos", href: "/tournaments" }, { label: "Crear" }];
  if (pathname === "/tournaments/join")
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos", href: "/tournaments" }, { label: "Unirme" }];
  if (pathname === "/account") return [{ label: "Dashboard", href: "/dashboard" }, { label: "Mi cuenta" }];
  if (pathname.startsWith("/account/passkeys"))
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Mi cuenta", href: "/account" }, { label: "Passkeys" }];
  if (pathname.startsWith("/account/"))
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Mi cuenta", href: "/account" }, { label: "Seguridad" }];

  if (pathname.startsWith("/tournaments/") && tournamentId) {
    const base: NavCrumb[] = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Torneos", href: "/tournaments" },
      { label: tournamentName ?? "Torneo", href: `/tournaments/${tournamentId}` },
    ];

    if (pathname === `/tournaments/${tournamentId}`) return base.map((c, idx) => (idx === base.length - 1 ? { label: c.label } : c));

    const matchdaysHref = `/tournaments/${tournamentId}/matchdays`;
    if (pathname === matchdaysHref) return [...base, { label: "Jornadas" }];
    if (pathname === `${matchdaysHref}/new`)
      return [...base, { label: "Jornadas", href: matchdaysHref }, { label: "Nueva jornada" }];

    if (pathname === `/tournaments/${tournamentId}/manage`) return [...base, { label: "Gestión" }];
    if (pathname === `/tournaments/${tournamentId}/admin`) return [...base, { label: "Editar torneo" }];

    const matchdayMatch = pathname.match(new RegExp(`^/tournaments/${tournamentId}/matchdays/([^/]+)(?:/(.+))?$`));
    if (matchdayMatch) {
      const matchdayId = matchdayMatch[1];
      const rest = matchdayMatch[2];
      const matchdayHref = `${matchdaysHref}/${matchdayId}`;

      if (!rest) return [...base, { label: "Jornadas", href: matchdaysHref }, { label: "Jornada" }];
      if (rest === "edit")
        return [...base, { label: "Jornadas", href: matchdaysHref }, { label: "Jornada", href: matchdayHref }, { label: "Editar" }];
      if (rest === "matches/new")
        return [...base, { label: "Jornadas", href: matchdaysHref }, { label: "Jornada", href: matchdayHref }, { label: "Agregar partido" }];
      return [...base, { label: "Jornadas", href: matchdaysHref }, { label: "Jornada", href: matchdayHref }, { label: rest }];
    }

    if (pathname.startsWith(`/tournaments/${tournamentId}/standings`)) return [...base, { label: "Ranking" }];
    if (pathname.startsWith(`/tournaments/${tournamentId}/members`)) return [...base, { label: "Participantes" }];

    const picksHref = `/tournaments/${tournamentId}/picks`;
    if (pathname === picksHref) return [...base, { label: "Picks" }];
    if (pathname.startsWith(`${picksHref}/`))
      return [...base, { label: "Picks", href: picksHref }, { label: "Detalle" }];

    if (pathname.startsWith(`/tournaments/${tournamentId}/invites`)) return [...base, { label: "Invitaciones" }];
    return base;
  }

  return [{ label: "Dashboard", href: "/dashboard" }, { label: "App" }];
}

export function getBackTarget(crumbs: NavCrumb[]): { href: string; label: string } | null {
  if (crumbs.length <= 1) {
    if (crumbs[0]?.label === "Dashboard") return { href: "/", label: "Inicio" };
    return null;
  }

  for (let i = crumbs.length - 2; i >= 0; i--) {
    const crumb = crumbs[i];
    if (crumb.href) return { href: crumb.href, label: crumb.label };
  }

  return { href: "/dashboard", label: "Dashboard" };
}

export function getAuthBackTarget(pathname: string): { href: string; label: string } {
  if (pathname === "/sign-up") return { href: "/", label: "Inicio" };
  if (pathname === "/forgot-password") return { href: "/sign-in", label: "Iniciar sesión" };
  if (pathname === "/reset-password") return { href: "/sign-in", label: "Iniciar sesión" };
  return { href: "/", label: "Inicio" };
}
