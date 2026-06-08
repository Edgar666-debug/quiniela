"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Eye,
  Pencil,
  Plus,
  Settings,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MatchdayRow = {
  id: string;
  number: number;
  closesAtUtc: string;
  matchesCount: number;
};

function isMatchdayClosed(closesAtUtc: string, nowMs: number) {
  return new Date(closesAtUtc).getTime() <= nowMs;
}

export function TournamentManageClient(props: {
  tournamentId: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  status: "ACTIVE" | "FINISHED" | "ARCHIVED";
  membersCount: number;
  matchdays: MatchdayRow[];
}) {
  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";
  const canEditTournament = props.role === "OWNER";
  const canCreateMatchday = canManage && props.status === "ACTIVE";

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const openCount = props.matchdays.filter((m) => !isMatchdayClosed(m.closesAtUtc, nowMs)).length;
  const closedCount = props.matchdays.length - openCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estado" value={props.status} />
        <StatCard label="Participantes" value={String(props.membersCount)} />
        <StatCard label="Jornadas abiertas" value={String(openCount)} />
        <StatCard label="Jornadas cerradas" value={String(closedCount)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {canEditTournament ? (
          <ActionCard
            href={`/tournaments/${props.tournamentId}/admin`}
            icon={<Settings className="size-5 text-emerald-600" />}
            title="Editar torneo"
            description="Nombre, logo y estado (archivar, finalizar)."
          />
        ) : null}
        <ActionCard
          href={`/tournaments/${props.tournamentId}/matchdays`}
          icon={<CalendarDays className="size-5 text-emerald-600" />}
          title="Ver jornadas"
          description="Listado completo y acceso a picks."
        />
        {canManage ? (
          <ActionCard
            href={`/tournaments/${props.tournamentId}/invites`}
            icon={<Ticket className="size-5 text-emerald-600" />}
            title="Invitaciones"
            description="Genera tokens para nuevos participantes."
          />
        ) : null}
        <ActionCard
          href={`/tournaments/${props.tournamentId}/members`}
          icon={<Users className="size-5 text-emerald-600" />}
          title="Participantes"
          description="Miembros y roles del torneo."
        />
        <ActionCard
          href={`/tournaments/${props.tournamentId}/picks`}
          icon={<Eye className="size-5 text-emerald-600" />}
          title="Picks"
          description="Consulta picks por participante."
        />
        <ActionCard
          href={`/tournaments/${props.tournamentId}/standings`}
          icon={<Trophy className="size-5 text-emerald-600" />}
          title="Ranking"
          description="Tabla de posiciones en vivo."
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Jornadas</CardTitle>
            <CardDescription>Gestiona fechas de cierre y accede a cada jornada.</CardDescription>
          </div>
          {canCreateMatchday ? (
            <Button asChild size="sm">
              <Link href={`/tournaments/${props.tournamentId}/matchdays/new`}>
                <Plus className="size-4" />
                Nueva jornada
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {props.matchdays.length === 0 ? (
            <p className="text-sm text-zinc-500">Aún no hay jornadas. Crea la primera para empezar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Partidos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.matchdays.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <MatchdayClose closesAtUtc={m.closesAtUtc} compact />
                        {isMatchdayClosed(m.closesAtUtc, nowMs) ? (
                          <Badge variant="secondary">Cerrada</Badge>
                        ) : (
                          <Badge variant="success">Abierta</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{m.matchesCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/tournaments/${props.tournamentId}/matchdays/${m.id}`}>Abrir</Link>
                        </Button>
                        {canManage && props.status === "ACTIVE" ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/tournaments/${props.tournamentId}/matchdays/${m.id}/edit`}>
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{props.label}</CardDescription>
        <CardTitle className="text-2xl">{props.value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ActionCard(props: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={props.href} className="group">
      <Card className="h-full transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-950/40">
        <CardHeader className="flex-row gap-3 space-y-0">
          <div className="mt-0.5 shrink-0">{props.icon}</div>
          <div className="space-y-1">
            <CardTitle className="text-base">{props.title}</CardTitle>
            <CardDescription>{props.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
