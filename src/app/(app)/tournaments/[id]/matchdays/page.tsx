import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchdaysClient } from "./MatchdaysClient";

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
    select: { name: true, status: true },
  });
  if (!tournament) redirect("/dashboard");

  const matchdays = await prisma.matchday.findMany({
    where: { tournamentId },
    orderBy: [{ number: "desc" }],
    select: { id: true, number: true, closesAtUtc: true, _count: { select: { matches: true } } },
  });

  const initial = matchdays.map((m) => ({
    id: m.id,
    number: m.number,
    closesAtUtc: m.closesAtUtc.toISOString(),
    matchesCount: m._count.matches,
  }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Jornadas</span>
          </div>
          <h1 className="text-2xl font-semibold">{tournament.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Elige una jornada para hacer tus picks.</p>
        </div>
      </div>

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
