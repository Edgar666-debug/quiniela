import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MatchNewClient } from "./MatchNewClient";

export default async function MatchNewPage(props: { params: Promise<{ id: string; matchdayId: string }> }) {
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
    select: { id: true, number: true, tournamentId: true, closesAtUtc: true },
  });
  if (!matchday || matchday.tournamentId !== tournamentId) redirect(`/tournaments/${tournamentId}/matchdays`);

  return (
    <MatchNewClient
      tournamentId={tournamentId}
      matchdayId={matchdayId}
      matchdayNumber={matchday.number}
      matchdayClosesAtUtc={matchday.closesAtUtc.toISOString()}
      role={membership.role}
    />
  );
}
