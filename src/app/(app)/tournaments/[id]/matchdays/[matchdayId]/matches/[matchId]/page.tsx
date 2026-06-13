import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiSportsGameWidgetPanel } from "@/components/api-football/api-sports-game-widget";
import { LocalDateTimeText } from "@/components/app/local-date-time";
import { statusLabel } from "@/lib/football";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(props: {
  params: Promise<{ id: string; matchdayId: string; matchId: string }>;
}): Promise<Metadata> {
  const { matchId } = await props.params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { homeTeam: true, awayTeam: true },
  });

  if (!match) return { title: "Partido" };
  return { title: `${match.homeTeam} vs ${match.awayTeam}` };
}

export default async function MatchGamePage(props: {
  params: Promise<{ id: string; matchdayId: string; matchId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId, matchdayId, matchId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) redirect("/dashboard");

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      externalFixtureId: true,
      homeTeam: true,
      awayTeam: true,
      statusShort: true,
      scoreHome: true,
      scoreAway: true,
      startsAtUtc: true,
      matchday: {
        select: {
          id: true,
          number: true,
          tournamentId: true,
          tournament: { select: { name: true } },
        },
      },
    },
  });

  if (!match || match.matchday.id !== matchdayId || match.matchday.tournamentId !== tournamentId) {
    redirect(`/tournaments/${tournamentId}/matchdays/${matchdayId}`);
  }

  if (!match.externalFixtureId) {
    redirect(`/tournaments/${tournamentId}/matchdays/${matchdayId}`);
  }

  const scoreLabel =
    match.scoreHome != null && match.scoreAway != null ? `${match.scoreHome}-${match.scoreAway}` : null;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <p className="text-muted-ui text-sm">{match.matchday.tournament.name}</p>
          <h1 className="text-2xl font-semibold">
            {match.homeTeam} vs {match.awayTeam}
          </h1>
          <p className="text-muted-ui text-sm">
            <LocalDateTimeText iso={match.startsAtUtc.toISOString()} prefix="Inicio" />
            {" · "}
            Estado: {statusLabel(match.statusShort)}
            {scoreLabel ? ` · ${scoreLabel}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle del partido</CardTitle>
          <CardDescription>Eventos, alineaciones y estadísticas vía API-Football.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiSportsGameWidgetPanel fixtureId={match.externalFixtureId} statusShort={match.statusShort} />
        </CardContent>
      </Card>
    </main>
  );
}
