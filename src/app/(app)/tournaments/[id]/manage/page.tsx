import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { auth } from "@/lib/auth";
import { canManageTournament } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { TournamentManageClient } from "./TournamentManageClient";

export const metadata: Metadata = {
  title: "Gestión del torneo",
};

export default async function TournamentManagePage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || !canManageTournament(membership.role)) redirect(`/tournaments/${tournamentId}`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, logoUrl: true, status: true },
  });
  if (!tournament) redirect("/dashboard");

  const [membersCount, matchdays] = await Promise.all([
    prisma.tournamentMember.count({ where: { tournamentId } }),
    prisma.matchday.findMany({
      where: { tournamentId },
      orderBy: [{ number: "desc" }],
      select: { id: true, number: true, closesAtUtc: true, _count: { select: { matches: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Gestión"
        description="Panel para administrar jornadas, participantes e invitaciones."
      />

      <TournamentManageClient
        tournamentId={tournamentId}
        role={membership.role}
        status={tournament.status}
        membersCount={membersCount}
        matchdays={matchdays.map((m) => ({
          id: m.id,
          number: m.number,
          closesAtUtc: m.closesAtUtc.toISOString(),
          matchesCount: m._count.matches,
        }))}
      />
    </main>
  );
}
