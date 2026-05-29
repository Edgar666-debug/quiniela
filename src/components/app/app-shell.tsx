"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, LayoutDashboard, Trophy, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type TournamentLink = { id: string; name: string; role: "OWNER" | "ORGANIZER" | "PLAYER" };

function NavItem(props: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Button
      asChild
      variant={props.active ? "secondary" : "ghost"}
      className={cn("w-full justify-start gap-2", props.active ? "" : "text-zinc-700 dark:text-zinc-200")}
    >
      <Link href={props.href}>
        {props.icon}
        {props.label}
      </Link>
    </Button>
  );
}

function Sidebar(props: { tournaments: TournamentLink[]; currentTournamentId: string | null }) {
  const pathname = usePathname();

  const currentTournament = useMemo(
    () => (props.currentTournamentId ? props.tournaments.find((t) => t.id === props.currentTournamentId) ?? null : null),
    [props.currentTournamentId, props.tournaments],
  );

  return (
    <nav className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 px-2">
        <Trophy className="h-5 w-5" />
        <span className="text-sm font-semibold">Quiniela</span>
      </div>

      <div className="flex flex-col gap-1">
        <NavItem href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={pathname === "/dashboard"} />
        <NavItem href="/tournaments" icon={<Trophy className="h-4 w-4" />} label="Torneos" active={pathname === "/tournaments" || pathname.startsWith("/tournaments/")} />
        <NavItem href="/account" icon={<User className="h-4 w-4" />} label="Mi cuenta" active={pathname === "/account"} />
      </div>

      <Separator />

      {currentTournament ? (
        <div className="flex flex-col gap-1">
          <p className="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Torneo actual</p>
          <div className="px-2">
            <p className="truncate text-sm font-semibold">{currentTournament.name}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Rol: {currentTournament.role}</p>
          </div>
          <NavItem
            href={`/tournaments/${currentTournament.id}`}
            icon={<Trophy className="h-4 w-4" />}
            label="Resumen"
            active={pathname === `/tournaments/${currentTournament.id}`}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/matchdays`}
            icon={<CalendarDays className="h-4 w-4" />}
            label="Jornadas"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/matchdays`)}
          />
          <NavItem
            href={`/tournaments/${currentTournament.id}/standings`}
            icon={<Trophy className="h-4 w-4" />}
            label="Ranking"
            active={pathname.startsWith(`/tournaments/${currentTournament.id}/standings`)}
          />
        </div>
      ) : (
        <p className="px-2 text-xs text-zinc-600 dark:text-zinc-400">Selecciona un torneo para ver más opciones.</p>
      )}
    </nav>
  );
}

export function AppShell(props: { tournaments: TournamentLink[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const currentTournamentId = useMemo(() => {
    const m = pathname.match(/^\/tournaments\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-zinc-200 p-4 dark:border-zinc-800 md:block">
          <Sidebar tournaments={props.tournaments} currentTournamentId={currentTournamentId} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/80 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-semibold">Quiniela</span>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    Menú
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Navegación</SheetTitle>
                    <SheetDescription>Accesos rápidos a la app.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(100%-3rem)]">
                    <Sidebar tournaments={props.tournaments} currentTournamentId={currentTournamentId} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>
          <div className="min-w-0">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
