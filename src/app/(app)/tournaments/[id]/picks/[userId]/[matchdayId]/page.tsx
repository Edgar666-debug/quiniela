import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantMatchdayPicksClient } from "./ParticipantMatchdayPicksClient";

export const metadata: Metadata = {
  title: "Picks del participante",
};

export default async function ParticipantMatchdayPicksPage(props: { params: Promise<{ id: string; userId: string; matchdayId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId, userId, matchdayId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) redirect("/dashboard");

  const participant = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: { user: { select: { name: true, email: true } }, tournament: { select: { name: true, logoUrl: true } } },
  });
  if (!participant) redirect(`/tournaments/${tournamentId}/picks`);

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, number: true, closesAtUtc: true, tournamentId: true },
  });
  if (!matchday || matchday.tournamentId !== tournamentId) redirect(`/tournaments/${tournamentId}/picks`);

  const matches = await prisma.match.findMany({
    where: { matchdayId },
    orderBy: [{ startsAtUtc: "asc" }],
    select: {
      id: true,
      externalFixtureId: true,
      startsAtUtc: true,
      homeTeam: true,
      homeLogoUrl: true,
      awayTeam: true,
      awayLogoUrl: true,
      statusShort: true,
      scoreHome: true,
      scoreAway: true,
      picks: { where: { userId }, select: { outcome: true }, take: 1 },
    },
  });

  const initial = {
    matchday: { number: matchday.number, closesAtUtc: matchday.closesAtUtc.toISOString() },
    participantLabel: participant.user.name ?? participant.user.email,
    matches: matches.map((m) => ({
      id: m.id,
      externalFixtureId: m.externalFixtureId,
      startsAtUtc: m.startsAtUtc.toISOString(),
      homeTeam: m.homeTeam,
      homeLogoUrl: m.homeLogoUrl,
      awayTeam: m.awayTeam,
      awayLogoUrl: m.awayLogoUrl,
      statusShort: m.statusShort,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      pick: m.picks[0]?.outcome ?? null,
    })),
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={participant.tournament.name}
        logoUrl={participant.tournament.logoUrl}
        eyebrow={`Jornada ${matchday.number}`}
        description={`Picks de ${participant.user.name ?? participant.user.email}`}
        meta={
          <p className="text-muted-ui text-sm">
            Cierre (UTC): {matchday.closesAtUtc.toISOString().replace("T", " ").slice(0, 16)}
          </p>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/tournaments/${tournamentId}/picks`}>
              <Eye className="size-4" />
              Participantes
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Picks</CardTitle>
          <CardDescription>Solo lectura.</CardDescription>
        </CardHeader>
        <CardContent>
          <ParticipantMatchdayPicksClient tournamentId={tournamentId} userId={userId} matchdayId={matchdayId} initial={initial} />
        </CardContent>
      </Card>
    </main>
  );
}
