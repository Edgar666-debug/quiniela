"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Eye, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/app/user-avatar";
import { formatLocalDateTime } from "@/lib/date";
import { cn } from "@/lib/utils";

type MemberRow = { id: string; name: string | null; email: string; image: string | null; role: "OWNER" | "ORGANIZER" | "PLAYER" };
type MatchdayRow = { id: string; number: number; closesAtUtc: string; isClosed: boolean; matchesCount: number };

export function TournamentPicksIndexClient(props: {
  tournamentId: string;
  members: MemberRow[];
  matchdays: MatchdayRow[];
  pickCounts: Record<string, Record<string, number>>;
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // show closed first, then open (open ones show progress bar)
  const sortedMatchdays = (() => {
    const closed = props.matchdays.filter((m) => m.isClosed);
    const open = props.matchdays.filter((m) => !m.isClosed);
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
                    <span className="text-muted-ui text-xs">{props.matchdays.length}</span>
                  </TableCell>
                </TableRow>

                {isOpen ? (
                  <TableRow key={`${m.id}-expanded`} className="hover:bg-transparent">
                    <TableCell colSpan={4} className="pt-0">
                      <div className="surface-panel-ui rounded-xl p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          {sortedMatchdays.map((md) => {
                            const href = `/tournaments/${props.tournamentId}/picks/${m.id}/${md.id}`;
                            const pickedCount = props.pickCounts[md.id]?.[m.id] ?? 0;
                            const pct = md.matchesCount > 0 ? Math.round((pickedCount / md.matchesCount) * 100) : 0;
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
                                  {!md.isClosed && md.matchesCount > 0 ? (
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                        <div
                                          className="h-full rounded-full bg-emerald-500 transition-all"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="shrink-0 text-xs tabular-nums">
                                        {pickedCount}/{md.matchesCount}
                                      </span>
                                    </div>
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
