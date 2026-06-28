import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Eye, GitBranch, LayoutDashboard, Settings, Trophy, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { auth } from "@/lib/auth";
import { canEditTournament, canManageTournament } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/app/inline-alert";
import { TournamentScopeBadge } from "@/components/tournaments/tournament-scope-badge";

export const metadata: Metadata = {
  title: "Resumen del torneo",
};

export default async function TournamentHomePage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { id: true, role: true },
  });
  if (!membership) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      name: true,
      status: true,
      logoUrl: true,
      scope: true,
      externalLeagueId: true,
      leagueName: true,
      leagueSeason: true,
    },
  });
  if (!tournament) redirect("/dashboard");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
            {tournament.logoUrl ? (
              <Image src={tournament.logoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Trophy className="size-6 text-zinc-500" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Trophy className="size-4" />
              <span className="text-sm">Torneo</span>
            </div>
            <h1 className="text-2xl font-semibold">{tournament.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TournamentScopeBadge tournament={tournament} />
              {tournament.status !== "ACTIVE" ? <InlineAlert variant="info" message={`Estado: ${tournament.status}`} /> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>Tabla de posiciones en vivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/tournaments/${tournamentId}/standings`}>
                <Trophy className="size-4" />
                Ver ranking
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jornadas</CardTitle>
            <CardDescription>Entrar a una jornada para hacer picks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/tournaments/${tournamentId}/matchdays`}>
                <CalendarDays className="size-4" />
                Ver jornadas
              </Link>
            </Button>
          </CardContent>
        </Card>

        {tournament.scope === "SINGLE_LEAGUE" ? (
          <Card>
            <CardHeader>
              <CardTitle>Llave</CardTitle>
              <CardDescription>Ver el cuadro de eliminación con los partidos ya cargados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={`/tournaments/${tournamentId}/bracket`}>
                  <GitBranch className="size-4" />
                  Ver llave
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>Ver miembros y administrar acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/tournaments/${tournamentId}/members`}>
                <Users className="size-4" />
                Ver participantes
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Picks</CardTitle>
            <CardDescription>Ver picks por participante después del cierre.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/tournaments/${tournamentId}/picks`}>
                <Eye className="size-4" />
                Ver picks
              </Link>
            </Button>
          </CardContent>
        </Card>

        {canManageTournament(membership.role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Gestión</CardTitle>
              <CardDescription>Panel para jornadas, participantes e invitaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={`/tournaments/${tournamentId}/manage`}>
                  <LayoutDashboard className="size-4" />
                  Abrir panel de gestión
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canEditTournament(membership.role) ? (
          <Card>
            <CardHeader>
              <CardTitle>Editar torneo</CardTitle>
              <CardDescription>Nombre, logo y estado del torneo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={`/tournaments/${tournamentId}/admin`}>
                  <Settings className="size-4" />
                  Configuración del torneo
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
