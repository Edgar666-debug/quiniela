"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MemberRow = { id: string; name: string | null; email: string; role: "OWNER" | "ORGANIZER" | "PLAYER" };
type MatchdayRow = { id: string; number: number; closesAtUtc: string; closesAtLabel: string; isClosed: boolean };

export function TournamentPicksIndexClient(props: { tournamentId: string; members: MemberRow[]; matchdays: MatchdayRow[] }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [closedOnly, setClosedOnly] = useState(true);

  const matchdaysClosedFirst = useMemo(() => {
    const closed = props.matchdays.filter((m) => m.isClosed);
    const open = props.matchdays.filter((m) => !m.isClosed);
    return closedOnly ? closed : [...closed, ...open];
  }, [props.matchdays, closedOnly]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.members;
    return props.members.filter((m) => (m.name ?? "").toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [props.members, query]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar participante (nombre o email)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={closedOnly ? "default" : "outline"} onClick={() => setClosedOnly(true)}>
            Solo cerradas
          </Button>
          <Button type="button" size="sm" variant={!closedOnly ? "default" : "outline"} onClick={() => setClosedOnly(false)}>
            Todas
          </Button>
        </div>
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
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="font-medium">{m.name ?? m.email}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{m.email}</p>
                  </TableCell>
                  <TableCell className="hidden py-2 sm:table-cell">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{m.role}</span>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{props.matchdays.length}</span>
                  </TableCell>
                </TableRow>

                {isOpen ? (
                  <TableRow key={`${m.id}-expanded`} className="hover:bg-transparent">
                    <TableCell colSpan={4} className="pt-0">
                      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black">
                        <div className="grid gap-2 md:grid-cols-2">
                          {matchdaysClosedFirst.map((md) => {
                            const href = `/tournaments/${props.tournamentId}/picks/${m.id}/${md.id}`;
                            const disabled = !md.isClosed;
                            return (
                              <div
                                key={md.id}
                                className={cn(
                                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                                  disabled
                                    ? "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400"
                                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black",
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">Jornada {md.number}</p>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Cierre (UTC): {md.closesAtLabel}</p>
                                </div>
                                {disabled ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Lock className="h-4 w-4" />
                                    <span>AÃºn abierta</span>
                                  </div>
                                ) : (
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={href}>Ver</Link>
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Sin participantes para esa bÃºsqueda.</p>
      ) : null}
    </div>
  );
}
