import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Eye } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PicksRevealClient } from "./picks-reveal-client";

export default async function MatchdayPicksPage(props: { params: Promise<{ id: string; matchdayId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId, matchdayId } = await props.params;

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, number: true, closesAtUtc: true, tournamentId: true },
  });
  if (!matchday || matchday.tournamentId !== tournamentId) redirect(`/tournaments/${tournamentId}/matchdays`);

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) redirect("/dashboard");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm">Jornada {matchday.number}</span>
        </div>
        <h1 className="text-2xl font-semibold">Picks de participantes</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Disponible solo después del cierre.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Picks revelados
          </CardTitle>
          <CardDescription>Se muestran solo cuando la jornada está cerrada.</CardDescription>
        </CardHeader>
        <CardContent>
          <PicksRevealClient matchdayId={matchdayId} />
        </CardContent>
      </Card>
    </main>
  );
}
