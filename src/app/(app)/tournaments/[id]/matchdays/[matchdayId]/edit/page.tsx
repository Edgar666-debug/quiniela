import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { auth } from "@/lib/auth";
import { canManageMatchdays } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MatchdayEditClient } from "./MatchdayEditClient";

export const metadata: Metadata = {
  title: "Editar jornada",
};

export default async function MatchdayEditPage(props: { params: Promise<{ id: string; matchdayId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId, matchdayId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || !canManageMatchdays(membership.role)) redirect(`/tournaments/${tournamentId}/matchdays/${matchdayId}`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, logoUrl: true, status: true },
  });
  if (!tournament) redirect("/dashboard");
  if (tournament.status !== "ACTIVE") redirect(`/tournaments/${tournamentId}/matchdays`);

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, number: true, closesAtUtc: true, tournamentId: true, _count: { select: { matches: true } } },
  });
  if (!matchday || matchday.tournamentId !== tournamentId) redirect(`/tournaments/${tournamentId}/matchdays`);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader name={tournament.name} logoUrl={tournament.logoUrl} eyebrow={`Editar jornada ${matchday.number}`} />

      <MatchdayEditClient
        tournamentId={tournamentId}
        matchdayId={matchdayId}
        initialNumber={matchday.number}
        initialClosesAtUtc={matchday.closesAtUtc.toISOString()}
        matchesCount={matchday._count.matches}
      />
    </main>
  );
}
