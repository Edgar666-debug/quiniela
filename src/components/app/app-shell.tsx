"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
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
import { ThemeToggle } from "@/components/app/theme-toggle";

type TournamentLink = { id: string; name: string; role: "OWNER" | "ORGANIZER" | "PLAYER" };
type AppUser = { email: string; name: string | null };

function SectionLabel(props: { children: React.ReactNode; collapsed: boolean }) {
  if (props.collapsed) return null;
  return <p className="px-2 pt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{props.children}</p>;
}

function NavItem(props: { href: string; icon: React.ReactNode; label: string; active?: boolean; collapsed: boolean }) {
  return (
    <Button
      asChild
      variant={props.active ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-2",
        props.collapsed ? "px-2" : "",
        props.active ? "" : "text-zinc-700 dark:text-zinc-200",
      )}
    >
      <Link href={props.href} aria-label={props.collapsed ? props.label : undefined}>
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
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const [tournamentMenuOpen, setTournamentMenuOpen] = useState(true);

  const currentTournament = useMemo(
    () => (props.currentTournamentId ? props.tournaments.find((t) => t.id === props.currentTournamentId) ?? null : null),
    [props.currentTournamentId, props.tournaments],
  );

  const canManageInvites = currentTournament?.role === "OWNER" || currentTournament?.role === "ORGANIZER";

  return (
    <nav className="flex h-full flex-col gap-3">
      <div className={cn("flex items-center gap-2 px-2", props.collapsed ? "justify-center" : "")}>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 shrink-0" />
          {props.collapsed ? null : <span className="text-sm font-semibold">Quiniela</span>}
        </div>
        {props.onToggleCollapsed ? (
          <Button
            className={cn("ml-auto", props.collapsed ? "hidden" : "")}
            variant="ghost"
            size="icon"
            type="button"
            onClick={props.onToggleCollapsed}
            aria-label="Alternar menú"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <SectionLabel collapsed={props.collapsed}>Navegación</SectionLabel>
      <div className="flex flex-col gap-1">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={pathname === "/dashboard"}
          collapsed={props.collapsed}
        />
        <NavItem
          href="/tournaments"
          icon={<Trophy className="h-4 w-4" />}
          label="Torneos"
          active={pathname === "/tournaments" || pathname.startsWith("/tournaments/")}
          collapsed={props.collapsed}
        />
        <NavItem
          href="/account"
          icon={<User className="h-4 w-4" />}
          label="Mi cuenta"
          active={pathname === "/account" || pathname.startsWith("/account/")}
          collapsed={props.collapsed}
        />
      </div>

      <Separator />

      {currentTournament ? (
        <div className="flex flex-col gap-1">
          <div className={cn("flex items-center gap-2 px-2", props.collapsed ? "justify-center" : "")}>
            {props.collapsed ? null : (
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">Torneo</p>
                <p className="truncate text-sm font-semibold">{currentTournament.name}</p>
              </div>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn("ml-auto", props.collapsed ? "hidden" : "")}
              onClick={() => setTournamentMenuOpen((v) => !v)}
              aria-label="Mostrar opciones del torneo"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", tournamentMenuOpen ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>

          {tournamentMenuOpen ? (
            <div className="flex flex-col gap-1">
              <NavItem
                href={`/tournaments/${currentTournament.id}`}
                icon={<Trophy className="h-4 w-4" />}
                label="Resumen"
                active={pathname === `/tournaments/${currentTournament.id}`}
                collapsed={props.collapsed}
              />
              <NavItem
                href={`/tournaments/${currentTournament.id}/matchdays`}
                icon={<CalendarDays className="h-4 w-4" />}
                label="Jornadas"
                active={pathname.startsWith(`/tournaments/${currentTournament.id}/matchdays`)}
                collapsed={props.collapsed}
              />
              <NavItem
                href={`/tournaments/${currentTournament.id}/standings`}
                icon={<Trophy className="h-4 w-4" />}
                label="Ranking"
                active={pathname.startsWith(`/tournaments/${currentTournament.id}/standings`)}
                collapsed={props.collapsed}
              />
              <NavItem
                href={`/tournaments/${currentTournament.id}/members`}
                icon={<Users className="h-4 w-4" />}
                label="Participantes"
                active={pathname.startsWith(`/tournaments/${currentTournament.id}/members`)}
                collapsed={props.collapsed}
              />
              {canManageInvites ? (
                <NavItem
                  href={`/tournaments/${currentTournament.id}/invites`}
                  icon={<Ticket className="h-4 w-4" />}
                  label="Invitaciones"
                  active={pathname.startsWith(`/tournaments/${currentTournament.id}/invites`)}
                  collapsed={props.collapsed}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        props.collapsed ? null : (
          <p className="px-2 text-xs text-zinc-600 dark:text-zinc-400">Selecciona un torneo para ver más opciones.</p>
        )
      )}

      <div className={cn("mt-auto flex flex-col gap-3", props.collapsed ? "items-center" : "")}>
        <Separator />
        <div className={cn("flex items-center gap-3 px-2", props.collapsed ? "justify-center px-0" : "")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
            {(props.user.name ?? props.user.email).slice(0, 1).toUpperCase()}
          </div>
          {props.collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{props.user.name ?? "Mi cuenta"}</p>
              <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{props.user.email}</p>
            </div>
          )}
        </div>

        <ThemeToggle collapsed={props.collapsed} />

        {props.collapsed && props.onToggleCollapsed ? (
          <Button variant="ghost" size="icon" type="button" onClick={props.onToggleCollapsed} aria-label="Alternar menú">
            <PanelLeft className="h-4 w-4" />
          </Button>
        ) : null}
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

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("app.sidebar.collapsed") === "1";
  });

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      globalThis.localStorage?.setItem("app.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div
        className={cn("mx-auto grid max-w-7xl grid-cols-1", collapsed ? "md:grid-cols-[84px_1fr]" : "md:grid-cols-[280px_1fr]")}
      >
        <aside className="sticky top-0 hidden h-screen border-r border-zinc-200 p-4 dark:border-zinc-800 md:block">
          <Sidebar
            user={props.user}
            tournaments={props.tournaments}
            currentTournamentId={currentTournamentId}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/80 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-semibold">Quiniela</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Sheet>
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
                      <Sidebar user={props.user} tournaments={props.tournaments} currentTournamentId={currentTournamentId} collapsed={false} />
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

