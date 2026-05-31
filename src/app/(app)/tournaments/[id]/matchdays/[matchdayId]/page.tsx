import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchdayClient } from "./MatchdayClient";

export default async function MatchdayPage(props: { params: Promise<{ id: string; matchdayId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId, matchdayId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) redirect("/dashboard");

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
      awayTeam: true,
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
      statusShort: m.statusShort,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      myPick: m.picks[0]?.outcome ?? null,
    })),
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Jornada {matchday.number}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Cierre (UTC): {matchday.closesAtUtc.toISOString().replace("T", " ").slice(0, 16)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(membership.role === "OWNER" || membership.role === "ORGANIZER") && (
            <Button asChild size="sm">
              <Link href={`/tournaments/${tournamentId}/matchdays/${matchdayId}/matches/new`}>
                <Plus className="h-4 w-4" />
                Agregar partido
              </Link>
            </Button>
          )}
        </div>
      </div>

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
