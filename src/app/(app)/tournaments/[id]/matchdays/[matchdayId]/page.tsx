import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchdayClient } from "./MatchdayClient";
import { MatchdayPageActions } from "./MatchdayPageActions";

export const metadata: Metadata = {
  title: "Detalle de jornada",
};

export default async function MatchdayPage(props: { params: Promise<{ id: string; matchdayId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId, matchdayId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, logoUrl: true, status: true },
  });
  if (!tournament) redirect("/dashboard");

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, number: true, closesAtUtc: true, tournamentId: true },
  });
  if (!matchday || matchday.tournamentId !== tournamentId) redirect(`/tournaments/${tournamentId}/matchdays`);

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
      picks: { where: { userId: session.user.id }, select: { outcome: true }, take: 1 },
    },
  });

  const initial = {
    role: membership.role,
    matchday: { id: matchday.id, number: matchday.number, closesAtUtc: matchday.closesAtUtc.toISOString() },
    matches: matches.map((m) => ({
      id: m.id,
      externalFixtureId: m.externalFixtureId,
      startsAtUtc: m.startsAtUtc.toISOString(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeLogoUrl: m.homeLogoUrl,
      awayLogoUrl: m.awayLogoUrl,
      statusShort: m.statusShort,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      myPick: m.picks[0]?.outcome ?? null,
    })),
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow={`Jornada ${matchday.number}`}
        meta={
          <p className="text-muted-ui text-sm">
            Cierre (UTC): {matchday.closesAtUtc.toISOString().replace("T", " ").slice(0, 16)}
          </p>
        }
        actions={
          <MatchdayPageActions
            tournamentId={tournamentId}
            matchdayId={matchdayId}
            role={membership.role}
            tournamentStatus={tournament.status}
            closesAtUtc={matchday.closesAtUtc.toISOString()}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Partidos</CardTitle>
          <CardDescription>Selecciona 1X2 antes del cierre. 1 punto por acierto.</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchdayClient matchdayId={matchdayId} initial={initial} />
        </CardContent>
      </Card>
    </main>
  );
}
