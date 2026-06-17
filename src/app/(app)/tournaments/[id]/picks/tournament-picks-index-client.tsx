"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Eye, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/app/user-avatar";
import { formatLocalDateTime } from "@/lib/date";
import type { ParticipantMatchdayStats } from "@/lib/matchday-list";
import { cn } from "@/lib/utils";

type MemberRow = { id: string; name: string | null; email: string; image: string | null; role: "OWNER" | "ORGANIZER" | "PLAYER" };
type MatchdayRow = { id: string; number: number; closesAtUtc: string; matchesCount: number };

export function TournamentPicksIndexClient(props: {
  tournamentId: string;
  members: MemberRow[];
  matchdays: MatchdayRow[];
  participantStats: Record<string, Record<string, ParticipantMatchdayStats>>;
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const matchdays = useMemo(
    () =>
      props.matchdays.map((m) => ({
        ...m,
        isClosed: nowMs >= new Date(m.closesAtUtc).getTime(),
      })),
    [props.matchdays, nowMs],
  );

  // show closed first, then open (open ones show progress bar)
  const sortedMatchdays = (() => {
    const closed = matchdays.filter((m) => m.isClosed);
    const open = matchdays.filter((m) => !m.isClosed);
    return [...closed, ...open];
  })();

  const filteredMembers = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.members;
    return props.members.filter((m) => (m.name ?? "").toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  })();

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar participante (nombre o email)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[44px]" />
            <TableHead>Participante</TableHead>
            <TableHead className="hidden sm:table-cell">Rol</TableHead>
            <TableHead className="text-right">Jornadas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.map((m) => {
            const isOpen = openUserId === m.id;
            return (
              <Fragment key={m.id}>
                <TableRow key={m.id} className="hover:bg-transparent">
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={isOpen ? "Contraer" : "Expandir"}
                      onClick={() => setOpenUserId((prev) => (prev === m.id ? null : m.id))}
                    >
                      {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={m.name} email={m.email} image={m.image} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.name ?? m.email}</p>
                        <p className="text-muted-ui truncate text-xs">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden py-2 sm:table-cell">
                    <span className="text-muted-ui text-xs">{m.role}</span>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <span className="text-muted-ui text-xs">{matchdays.length}</span>
                  </TableCell>
                </TableRow>

                {isOpen ? (
                  <TableRow key={`${m.id}-expanded`} className="hover:bg-transparent">
                    <TableCell colSpan={4} className="pt-0">
                      <div className="surface-panel-ui rounded-xl p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          {sortedMatchdays.map((md) => {
                            const href = `/tournaments/${props.tournamentId}/picks/${m.id}/${md.id}`;
                            const stats = props.participantStats[md.id]?.[m.id];
                            const pickedCount = stats?.pickCount ?? 0;
                            const fillPercent = md.matchesCount > 0 ? Math.round((pickedCount / md.matchesCount) * 100) : 0;
                            const complete = md.matchesCount > 0 && pickedCount >= md.matchesCount;
                            const showAccuracy = md.isClosed && (stats?.scoredMatchesCount ?? 0) > 0;
                            const percent = showAccuracy ? (stats?.accuracyPercent ?? 0) : fillPercent;
                            const label = showAccuracy
                              ? `${stats?.correctCount ?? 0}/${stats?.scoredMatchesCount ?? 0} aciertos`
                              : complete
                                ? "✓ Completo"
                                : `${pickedCount}/${md.matchesCount} picks`;
                            const barClass = showAccuracy
                              ? percent >= 70
                                ? "bg-emerald-500"
                                : percent > 0
                                  ? "bg-amber-400"
                                  : "bg-zinc-200 dark:bg-zinc-700"
                              : complete
                                ? "bg-emerald-500"
                                : pickedCount > 0
                                  ? "bg-amber-400"
                                  : "bg-zinc-200 dark:bg-zinc-700";
                            const labelClass = showAccuracy
                              ? percent >= 70
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-ui"
                              : complete
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-ui";

                            return (
                              <div
                                key={md.id}
                                className={cn(
                                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                                  !md.isClosed
                                    ? "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400"
                                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">Jornada {md.number}</p>
                                  <p className="text-muted-ui text-xs">Cierre: {formatLocalDateTime(md.closesAtUtc)}</p>
                                  {md.matchesCount > 0 ? (
                                    md.isClosed && (stats?.scoredMatchesCount ?? 0) === 0 ? (
                                      <p className="text-muted-ui mt-1.5 text-xs">Esperando resultados</p>
                                    ) : (
                                      <div className="mt-1.5 flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className={`text-xs font-medium ${labelClass}`}>{label}</span>
                                          <span className="text-muted-ui text-xs tabular-nums">{percent}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                          <div
                                            className={`h-full rounded-full transition-all ${barClass}`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    )
                                  ) : null}
                                </div>
                                {!md.isClosed ? (
                                  <Lock className="size-4 shrink-0" />
                                ) : (
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={href}><Eye className="size-4" /></Link>
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      {filteredMembers.length === 0 ? (
        <p className="text-muted-ui text-sm">Sin participantes para esa búsqueda.</p>
      ) : null}
    </div>
  );
}
