import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";

import { auth } from "@/lib/auth";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncLiveButton } from "./sync-live-button";
import { TournamentPicksIndexClient } from "./tournament-picks-index-client";

export const metadata: Metadata = {
  title: "Picks",
};

export default async function TournamentPicksIndexPage(props: { params: Promise<{ id: string }> }) {
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
    select: { id: true, name: true, logoUrl: true },
  });
  if (!tournament) redirect("/dashboard");

  const [members, matchdays] = await Promise.all([
    prisma.tournamentMember.findMany({
      where: { tournamentId },
      orderBy: [{ joinedAt: "asc" }],
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.matchday.findMany({
      where: { tournamentId },
      orderBy: [{ number: "desc" }],
      select: { id: true, number: true, closesAtUtc: true, _count: { select: { matches: true } } },
    }),
  ]);

  const pickCounts: Record<string, Record<string, number>> = {};
  const picks = await prisma.pick.findMany({
    where: { match: { matchday: { tournamentId } } },
    select: { userId: true, match: { select: { matchdayId: true } } },
  });
  for (const p of picks) {
    const mid = p.match.matchdayId;
    pickCounts[mid] ??= {};
    pickCounts[mid][p.userId] = (pickCounts[mid][p.userId] ?? 0) + 1;
  }

  const matchdayRows = matchdays.map((m) => ({
    id: m.id,
    number: m.number,
    closesAtUtc: m.closesAtUtc.toISOString(),
    matchesCount: m._count.matches,
  }));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Picks"
        description="Selecciona un participante y luego una jornada cerrada para ver sus picks."
        actions={membership.role === "OWNER" ? <SyncLiveButton tournamentId={tournamentId} /> : null}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-4" />
            Picks
          </CardTitle>
          <CardDescription>Las jornadas se habilitan después del cierre.</CardDescription>
        </CardHeader>
        <CardContent>
          <TournamentPicksIndexClient
            tournamentId={tournamentId}
            members={members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              image: m.user.image,
              role: m.role,
            }))}
            matchdays={matchdayRows}
            pickCounts={pickCounts}
          />
        </CardContent>
      </Card>
    </main>
  );
}
