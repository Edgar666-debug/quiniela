import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchdaysClient } from "./MatchdaysClient";

export const metadata: Metadata = {
  title: "Jornadas",
};

export default async function TournamentMatchdaysPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, status: true, logoUrl: true },
  });
  if (!tournament) redirect("/dashboard");

  const matchdays = await prisma.matchday.findMany({
    where: { tournamentId },
    orderBy: [{ number: "desc" }],
    select: {
      id: true,
      number: true,
      closesAtUtc: true,
      _count: { select: { matches: true } },
      matches: {
        select: {
          _count: { select: { picks: { where: { userId: session.user.id } } } },
        },
      },
    },
  });

  const initial = matchdays.map((m) => ({
    id: m.id,
    number: m.number,
    closesAtUtc: m.closesAtUtc.toISOString(),
    matchesCount: m._count.matches,
    myPicksCount: m.matches.reduce((sum, match) => sum + (match._count.picks > 0 ? 1 : 0), 0),
  }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Jornadas"
        description="Elige una jornada para hacer tus picks."
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Las jornadas se cierran por horario (UTC).</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchdaysClient tournamentId={tournamentId} role={membership.role} tournamentStatus={tournament.status} initial={initial} />
        </CardContent>
      </Card>
    </main>
  );
}
