"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Menu,
  PanelLeft,
  Ticket,
  Trophy,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";

type TournamentLink = { id: string; name: string; role: "OWNER" | "ORGANIZER" | "PLAYER" };
type AppUser = { email: string; name: string | null };

function SectionLabel(props: { children: React.ReactNode; collapsed: boolean }) {
  if (props.collapsed) return null;
  return <p className="px-2 pt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{props.children}</p>;
}

function NavItem(props: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Button
      asChild
      variant={props.active ? "secondary" : "ghost"}
      className={cn(
        props.collapsed ? "h-10 w-10 justify-center px-0" : "w-full justify-start gap-2",
        props.active ? "" : "text-zinc-700 dark:text-zinc-200",
      )}
    >
      <Link
        href={props.href}
        aria-label={props.collapsed ? props.label : undefined}
        title={props.collapsed ? props.label : undefined}
        onClick={() => {
          props.onNavigate?.();
        }}
      >
        {props.icon}
        {props.collapsed ? null : props.label}
      </Link>
    </Button>
  );
}

function Sidebar(props: {
  user: AppUser;
  tournaments: TournamentLink[];
  currentTournamentId: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const currentTournament = useMemo(
    () => (props.currentTournamentId ? props.tournaments.find((t) => t.id === props.currentTournamentId) ?? null : null),
    [props.currentTournamentId, props.tournaments],
  );

  const canManageInvites = currentTournament?.role === "OWNER" || currentTournament?.role === "ORGANIZER";

  return (
    <nav className={cn("flex h-full flex-col gap-3", props.collapsed ? "items-center" : "")}>
      <div className={cn("flex items-center gap-2 px-2", props.collapsed ? "px-0" : "")}>
        <div
          className={cn(
            "flex items-center gap-2",
            props.collapsed ? "h-10 w-10 justify-center rounded-xl border border-zinc-200 dark:border-zinc-800" : "",
          )}
        >
          <Trophy className="h-5 w-5 shrink-0" />
          {props.collapsed ? null : <span className="text-sm font-semibold">Quiniela</span>}
        </div>
      </div>

      <SectionLabel collapsed={props.collapsed}>Navegación</SectionLabel>
      <div className={cn("flex flex-col gap-1", props.collapsed ? "items-center" : "")}>
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={pathname === "/dashboard"}
          collapsed={props.collapsed}
          onNavigate={props.onNavigate}
        />
        <NavItem
          href="/tournaments"
          icon={<Trophy className="h-4 w-4" />}
          label="Torneos"
          active={pathname === "/tournaments" || pathname.startsWith("/tournaments/")}
          collapsed={props.collapsed}
          onNavigate={props.onNavigate}
        />
        <NavItem
          href="/account"
          icon={<User className="h-4 w-4" />}
          label="Mi cuenta"
          active={pathname === "/account" || pathname.startsWith("/account/")}
          collapsed={props.collapsed}
          onNavigate={props.onNavigate}
        />
      </div>

      <Separator className={cn(props.collapsed ? "w-10" : "")} />

      {currentTournament ? (
        <div className={cn("flex flex-col gap-1", props.collapsed ? "items-center" : "")}>
          <SectionLabel collapsed={props.collapsed}>Torneo</SectionLabel>
          {props.collapsed ? (
            <div className="h-10 w-10 rounded-xl border border-zinc-200 p-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
              <Trophy className="h-5 w-5" />
            </div>
          ) : (
            <div className="px-2">
              <p className="truncate text-sm font-semibold">{currentTournament.name}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Rol: {currentTournament.role}</p>
            </div>
          )}

          <NavItem
            href={`/tournaments/${currentTournament.id}`}
            icon={<Trophy className="h-4 w-4" />}
            label="Resumen"
            active={pathname === `/tournaments/${currentTournament.id}`}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/matchdays`}
            icon={<CalendarDays className="h-4 w-4" />}
            label="Jornadas"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/matchdays`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/standings`}
            icon={<Trophy className="h-4 w-4" />}
            label="Ranking"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/standings`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/members`}
            icon={<Users className="h-4 w-4" />}
            label="Participantes"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/members`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/picks`}
            icon={<ListChecks className="h-4 w-4" />}
            label="Picks"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/picks`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          {canManageInvites ? (
            <NavItem
              href={`/tournaments/${currentTournament.id}/invites`}
              icon={<Ticket className="h-4 w-4" />}
              label="Invitaciones"
              active={pathname.startsWith(`/tournaments/${currentTournament.id}/invites`)}
              collapsed={props.collapsed}
              onNavigate={props.onNavigate}
            />
          ) : null}
        </div>
      ) : (
        props.collapsed ? null : (
          <p className="px-2 text-xs text-zinc-600 dark:text-zinc-400">Selecciona un torneo para ver más opciones.</p>
        )
      )}

      <div className={cn("mt-auto flex flex-col gap-3", props.collapsed ? "items-center" : "")}>
        <Separator className={cn(props.collapsed ? "w-10" : "")} />
        <UserMenu user={props.user} collapsed={props.collapsed} onNavigate={props.onNavigate} />
      </div>
    </nav>
  );
}

export function AppShell(props: { user: AppUser; tournaments: TournamentLink[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTournamentId = useMemo(() => {
    const m = pathname.match(/^\/tournaments\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const currentTournament = useMemo(
    () => (currentTournamentId ? props.tournaments.find((t) => t.id === currentTournamentId) ?? null : null),
    [currentTournamentId, props.tournaments],
  );

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("app.sidebar.collapsed") === "1";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      globalThis.localStorage?.setItem("app.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className={cn("mx-auto grid max-w-7xl grid-cols-1", collapsed ? "md:grid-cols-[84px_1fr]" : "md:grid-cols-[280px_1fr]")}>
        <aside className="sticky top-0 hidden h-screen border-r border-zinc-200 p-4 dark:border-zinc-800 md:block">
          <Sidebar user={props.user} tournaments={props.tournaments} currentTournamentId={currentTournamentId} collapsed={collapsed} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 hidden border-b border-zinc-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-zinc-800 dark:bg-black/80 md:block">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="icon" type="button" onClick={toggleCollapsed} aria-label="Alternar menú">
                  <PanelLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <AppBreadcrumbs items={buildCrumbs(pathname, currentTournament?.name ?? null, currentTournamentId)} />
                </div>
              </div>
              <ThemeToggle collapsed align="right" />
            </div>
          </header>

          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/80 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-semibold">Quiniela</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle collapsed align="right" />
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" aria-label="Abrir menú">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Navegación</SheetTitle>
                      <SheetDescription>Accesos rápidos a la app.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 h-[calc(100%-3rem)]">
                      <Sidebar
                        user={props.user}
                        tournaments={props.tournaments}
                        currentTournamentId={currentTournamentId}
                        collapsed={false}
                        onNavigate={() => setMobileNavOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>

          <div className="min-w-0">{props.children}</div>
        </div>
      </div>
    </div>
  );
}

function buildCrumbs(pathname: string, tournamentName: string | null, tournamentId: string | null) {
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  if (pathname === "/tournaments") return [{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos" }];
  if (pathname === "/tournaments/new")
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos", href: "/tournaments" }, { label: "Crear" }];
  if (pathname === "/tournaments/join")
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos", href: "/tournaments" }, { label: "Unirme" }];
  if (pathname === "/account") return [{ label: "Dashboard", href: "/dashboard" }, { label: "Mi cuenta" }];
  if (pathname.startsWith("/account/"))
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Mi cuenta", href: "/account" }, { label: "Seguridad" }];

  if (pathname.startsWith("/tournaments/") && tournamentId) {
    const base = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Torneos", href: "/tournaments" },
      { label: tournamentName ?? "Torneo", href: `/tournaments/${tournamentId}` },
    ];
    if (pathname === `/tournaments/${tournamentId}`) return base.map((c, idx) => (idx === base.length - 1 ? { label: c.label } : c));
    if (pathname.startsWith(`/tournaments/${tournamentId}/matchdays`)) return [...base, { label: "Jornadas" }];
    if (pathname.startsWith(`/tournaments/${tournamentId}/standings`)) return [...base, { label: "Ranking" }];
    if (pathname.startsWith(`/tournaments/${tournamentId}/members`)) return [...base, { label: "Participantes" }];
    if (pathname.startsWith(`/tournaments/${tournamentId}/picks`)) return [...base, { label: "Picks" }];
    if (pathname.startsWith(`/tournaments/${tournamentId}/invites`)) return [...base, { label: "Invitaciones" }];
    return base;
  }

  return [{ label: "Dashboard", href: "/dashboard" }, { label: "App" }];
}
