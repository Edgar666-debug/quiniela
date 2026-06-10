"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Eye, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MemberRow = { id: string; name: string | null; email: string; role: "OWNER" | "ORGANIZER" | "PLAYER" };
type MatchdayRow = { id: string; number: number; closesAtUtc: string; closesAtLabel: string; isClosed: boolean };

export function TournamentPicksIndexClient(props: { tournamentId: string; members: MemberRow[]; matchdays: MatchdayRow[] }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const closedOnly = true;

  const matchdaysClosedFirst = (() => {
    const closed = props.matchdays.filter((m) => m.isClosed);
    const open = props.matchdays.filter((m) => !m.isClosed);
    return closedOnly ? closed : [...closed, ...open];
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
        {/* <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={closedOnly ? "default" : "outline"} onClick={() => setClosedOnly(true)}>
            Solo cerradas
          </Button>
          <Button type="button" size="sm" variant={!closedOnly ? "default" : "outline"} onClick={() => setClosedOnly(false)}>
            Todas
          </Button>
        </div> */}
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
                    <p className="font-medium">{m.name ?? m.email}</p>
                    <p className="text-muted-ui text-xs">{m.email}</p>
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
                                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">Jornada {md.number}</p>
                                  <p className="text-muted-ui text-xs">Cierre (UTC): {md.closesAtLabel}</p>
                                </div>
                                {disabled ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Lock className="size-4" />
                                    <span>Aún abierta</span>
                                  </div>
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
