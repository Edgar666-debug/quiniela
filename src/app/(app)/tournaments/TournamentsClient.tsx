"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownAZ,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Ticket,
  Trophy,
} from "lucide-react";

import { canEditTournament, canManageTournament } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export type TournamentRow = {
  tournamentId: string;
  name: string;
  logoUrl: string | null;
  status: "ACTIVE" | "FINISHED" | "ARCHIVED";
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  membersCount: number;
  matchdaysCount: number;
};

type StatusFilter = "ALL" | "ACTIVE" | "FINISHED" | "ARCHIVED";
type SortMode = "name-asc" | "name-desc";
type ViewMode = "grid" | "list";

function statusLabel(status: TournamentRow["status"]) {
  if (status === "ACTIVE") return "Activo";
  if (status === "FINISHED") return "Finalizado";
  return "Archivado";
}

function roleLabel(role: TournamentRow["role"]) {
  if (role === "OWNER") return "Owner";
  if (role === "ORGANIZER") return "Organizer";
  return "Player";
}

export function TournamentsClient(props: { tournaments: TournamentRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = props.tournaments.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q);
    });

    rows = [...rows].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, "es");
      return sortMode === "name-asc" ? cmp : -cmp;
    });

    return rows;
  }, [props.tournaments, query, sortMode, statusFilter]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Torneos</h1>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar torneo"
              className="h-10 rounded-full pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-10 rounded-full px-4">
                Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <DropdownMenuRadioItem value="ALL">Todos</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ACTIVE">Activo</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="FINISHED">Finalizado</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ARCHIVED">Archivado</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-10 rounded-full px-4">
                <ArrowDownAZ className="size-4" />
                Ordenar por nombre
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Orden</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <DropdownMenuRadioItem value="name-asc">A → Z</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name-desc">Z → A</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "size-8 rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                viewMode === "grid" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100" : "",
              )}
              onClick={() => setViewMode("grid")}
              aria-label="Vista en cuadrícula"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "size-8 rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                viewMode === "list" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100" : "",
              )}
              onClick={() => setViewMode("list")}
              aria-label="Vista en lista"
            >
              <List className="size-4" />
            </Button>
          </div>

          <Button asChild variant="outline" className="hidden h-10 rounded-full sm:inline-flex">
            <Link href="/tournaments/join">
              <Ticket className="size-4" />
              Unirme
            </Link>
          </Button>

          <Button asChild className="h-10 rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600">
            <Link href="/tournaments/new">
              <Plus className="size-4" />
              Nuevo torneo
            </Link>
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <Trophy className="mx-auto size-10 text-zinc-400 dark:text-zinc-600" />
          <p className="mt-4 text-lg font-medium">
            {props.tournaments.length === 0 ? "Aún no tienes torneos" : "Sin resultados"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {props.tournaments.length === 0
              ? "Crea uno nuevo o únete con una invitación."
              : "Prueba otro filtro o término de búsqueda."}
          </p>
          {props.tournaments.length === 0 ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild className="rounded-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                <Link href="/tournaments/new">
                  <Plus className="size-4" />
                  Nuevo torneo
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/tournaments/join">Unirme por invitación</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TournamentCard key={t.tournamentId} tournament={t} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <TournamentListRow key={t.tournamentId} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TournamentCardMenu(props: { tournament: TournamentRow }) {
  const t = props.tournament;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Opciones del torneo" 
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/tournaments/${t.tournamentId}`}>Abrir resumen</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/tournaments/${t.tournamentId}/matchdays`}>Jornadas</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/tournaments/${t.tournamentId}/standings`}>Ranking</Link>
        </DropdownMenuItem>
        {canManageTournament(t.role) ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tournaments/${t.tournamentId}/manage`}>Gestionar</Link>
            </DropdownMenuItem>
          </>
        ) : null}
        {canEditTournament(t.role) ? (
          <DropdownMenuItem asChild>
            <Link href={`/tournaments/${t.tournamentId}/admin`}>
              <Settings className="size-4" />
              Editar torneo
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TournamentCard(props: { tournament: TournamentRow }) {
  const t = props.tournament;

  return (
    <div className="group relative flex min-h-[140px] flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <div className="absolute right-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
        <TournamentCardMenu tournament={t} />
      </div>

      <Link href={`/tournaments/${t.tournamentId}`} className="flex min-h-[108px] flex-1 flex-col pr-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-900 group-hover:text-black dark:text-zinc-50 dark:group-hover:text-white">{t.name}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {roleLabel(t.role)} · {t.matchdaysCount} jornada{t.matchdaysCount === 1 ? "" : "s"} · {t.membersCount} miembro
            {t.membersCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] uppercase tracking-wide">
            {statusLabel(t.status)}
          </Badge>
          {t.logoUrl ? (
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
              <Image src={t.logoUrl} alt="" width={32} height={32} className="size-full object-cover" unoptimized />
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  );
}

function TournamentListRow(props: { tournament: TournamentRow }) {
  const t = props.tournament;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <Link href={`/tournaments/${t.tournamentId}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
          {t.logoUrl ? (
            <Image src={t.logoUrl} alt="" width={40} height={40} className="size-full object-cover" unoptimized />
          ) : (
            <Trophy className="size-4 text-zinc-400 dark:text-zinc-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{t.name}</p>
          <p className="text-sm text-zinc-500">
            {roleLabel(t.role)} · {t.matchdaysCount} jornadas · {t.membersCount} miembros
          </p>
        </div>
        <Badge variant="outline" className="hidden shrink-0 rounded-md text-[11px] uppercase sm:inline-flex">
          {statusLabel(t.status)}
        </Badge>
      </Link>
      <TournamentCardMenu tournament={t} />
    </div>
  );
}
