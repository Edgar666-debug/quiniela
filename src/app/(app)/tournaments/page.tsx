import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TournamentsClient } from "./TournamentsClient";

export const metadata: Metadata = {
  title: "Torneos",
};

export default async function TournamentsIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const memberships = await prisma.tournamentMember.findMany({
    where: { userId: session.user.id },
    select: {
      role: true,
      tournament: {
        select: {
          id: true,
          name: true,
          status: true,
          logoUrl: true,
          scope: true,
          externalLeagueId: true,
          leagueName: true,
          leagueSeason: true,
          _count: { select: { members: true, matchdays: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10">
      <TournamentsClient
        tournaments={memberships.map((m) => ({
          tournamentId: m.tournament.id,
          name: m.tournament.name,
          logoUrl: m.tournament.logoUrl,
          status: m.tournament.status,
          role: m.role,
          membersCount: m.tournament._count.members,
          matchdaysCount: m.tournament._count.matchdays,
          scope: m.tournament.scope,
          externalLeagueId: m.tournament.externalLeagueId,
          leagueName: m.tournament.leagueName,
          leagueSeason: m.tournament.leagueSeason,
        }))}
      />
    </main>
  );
}
