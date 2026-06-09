"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Menu,
  PanelLeft,
  Settings,
  Ticket,
  Trophy,
  User,
  Users,
  Eye,
  ChartLine
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppBackButton } from "@/components/app/back-button";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";
import { buildAppCrumbs } from "@/lib/app-nav";

type TournamentLink = { id: string; name: string; logoUrl?: string | null; status: "ACTIVE" | "FINISHED" | "ARCHIVED"; role: "OWNER" | "ORGANIZER" | "PLAYER" };
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
        props.collapsed ? "size-10 justify-center px-0" : "w-full justify-start gap-2",
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

  const currentTournament = props.currentTournamentId
    ? props.tournaments.find((t) => t.id === props.currentTournamentId) ?? null
    : null;

  const canManageInvites =
    (currentTournament?.role === "OWNER" || currentTournament?.role === "ORGANIZER") && currentTournament?.status === "ACTIVE";
  const canManageTournamentNav =
    currentTournament?.role === "OWNER" || currentTournament?.role === "ORGANIZER";
  const canEditTournamentNav = currentTournament?.role === "OWNER";

  return (
    <nav className={cn("flex h-full flex-col gap-3", props.collapsed ? "items-center" : "")}>
      <div className={cn("flex items-center gap-2 px-2", props.collapsed ? "px-0" : "")}>
        <div
          className={cn(
            "flex items-center gap-2",
            props.collapsed ? "size-10 justify-center rounded-xl border border-zinc-200 dark:border-zinc-800" : "",
          )}
        >
          <Trophy className="size-5 shrink-0" />
          {props.collapsed ? null : <span className="text-sm font-semibold">Quiniela</span>}
        </div>
      </div>

      <SectionLabel collapsed={props.collapsed}>Navegación</SectionLabel>
      <div className={cn("flex flex-col gap-1", props.collapsed ? "items-center" : "")}>
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="size-4" />}
          label="Dashboard"
          active={pathname === "/dashboard"}
          collapsed={props.collapsed}
          onNavigate={props.onNavigate}
        />
        <NavItem
          href="/tournaments"
          icon={<Trophy className="size-4" />}
          label="Torneos"
          active={pathname === "/tournaments" || pathname.startsWith("/tournaments/")}
          collapsed={props.collapsed}
          onNavigate={props.onNavigate}
        />
        <NavItem
          href="/account"
          icon={<User className="size-4" />}
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
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
              {currentTournament.logoUrl ? (
                <Image src={currentTournament.logoUrl} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
              ) : (
                <Trophy className="size-5" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <div className="flex size-11 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                {currentTournament.logoUrl ? (
                  <Image src={currentTournament.logoUrl} alt="" width={44} height={44} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <Trophy className="size-5 text-zinc-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{currentTournament.name}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Rol: {currentTournament.role}</p>
              </div>
            </div>
          )}

          <NavItem
            href={`/tournaments/${currentTournament.id}`}
            icon={<Eye className="size-4" />}
            label="Resumen"
            active={pathname === `/tournaments/${currentTournament.id}`}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          {canManageTournamentNav ? (
            <NavItem
              href={`/tournaments/${currentTournament.id}/manage`}
              icon={<LayoutDashboard className="size-4" />}
              label="Gestión"
              active={pathname.startsWith(`/tournaments/${currentTournament.id}/manage`)}
              collapsed={props.collapsed}
              onNavigate={props.onNavigate}
            />
          ) : null}
          {canEditTournamentNav ? (
            <NavItem
              href={`/tournaments/${currentTournament.id}/admin`}
              icon={<Settings className="size-4" />}
              label="Editar torneo"
              active={pathname.startsWith(`/tournaments/${currentTournament.id}/admin`)}
              collapsed={props.collapsed}
              onNavigate={props.onNavigate}
            />
          ) : null}
          <NavItem
            href={`/tournaments/${currentTournament.id}/matchdays`}
            icon={<CalendarDays className="size-4" />}
            label="Jornadas"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/matchdays`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/standings`}
            icon={<ChartLine className="size-4" />}
            label="Ranking"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/standings`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/members`}
            icon={<Users className="size-4" />}
            label="Participantes"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/members`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/picks`}
            icon={<ListChecks className="size-4" />}
            label="Picks"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/picks`)}
            collapsed={props.collapsed}
            onNavigate={props.onNavigate}
          />
          {canManageInvites ? (
            <NavItem
              href={`/tournaments/${currentTournament.id}/invites`}
              icon={<Ticket className="size-4" />}
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
  const currentTournamentId = pathname.match(/^\/tournaments\/([^/]+)/)?.[1] ?? null;

  const currentTournament = currentTournamentId
    ? props.tournaments.find((t) => t.id === currentTournamentId) ?? null
    : null;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (globalThis.localStorage?.getItem("app.sidebar.collapsed") === "1") {
      setTimeout(() => {
        setCollapsed(true);
      }, 100);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      globalThis.localStorage?.setItem("app.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className={cn("mx-auto grid max-w-7xl grid-cols-1", collapsed ? "md:grid-cols-[84px_1fr]" : "md:grid-cols-[280px_1fr]")}>
        <aside className="sticky top-0 hidden h-screen border-r border-zinc-200 p-4 dark:border-zinc-800 md:block">
          <Sidebar user={props.user} tournaments={props.tournaments} currentTournamentId={currentTournamentId} collapsed={collapsed} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 hidden border-b border-zinc-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:block">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="icon" type="button" onClick={toggleCollapsed} aria-label="Alternar menú">
                  <PanelLeft className="size-4" />
                </Button>
                <AppBackButton tournamentId={currentTournamentId} tournamentName={currentTournament?.name ?? null} />
                <div className="min-w-0">
                  <AppBreadcrumbs items={buildAppCrumbs(pathname, currentTournament?.name ?? null, currentTournamentId)} />
                </div>
              </div>
              <ThemeToggle collapsed align="right" />
            </div>
          </header>

          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <AppBackButton
                  compact
                  tournamentId={currentTournamentId}
                  tournamentName={currentTournament?.name ?? null}
                />
                <div className="flex min-w-0 items-center gap-2">
                  {currentTournament ? (
                    <>
                      <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                        {currentTournament.logoUrl ? (
                          <Image src={currentTournament.logoUrl} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                        ) : (
                          <Trophy className="size-4 shrink-0" />
                        )}
                      </div>
                      <span className="truncate text-sm font-semibold">{currentTournament.name}</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="size-5 shrink-0" />
                      <span className="truncate text-sm font-semibold">Quiniela</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle collapsed align="right" />
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" aria-label="Abrir menú">
                      <Menu className="size-4" />
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
