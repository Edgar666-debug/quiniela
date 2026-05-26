import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StandingsLive } from "./StandingsLive";

export default async function TournamentStandingsPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true },
  });
  if (!tournament) redirect("/dashboard");

  const initial = await prisma.standing.findMany({
    where: { tournamentId },
    orderBy: [{ points: "desc" }, { updatedAt: "desc" }],
    select: {
      points: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{tournament.name}</h1>
        <p className="text-sm text-zinc-600">Ranking en vivo</p>
      </div>
      <StandingsLive tournamentId={tournamentId} initial={initial} />
    </main>
  );
}

