import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Eye, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentPicksIndexClient } from "./tournament-picks-index-client";

function formatUtcShort(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default async function TournamentPicksIndexPage(props: { params: Promise<{ id: string }> }) {
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
    select: { id: true, name: true },
  });
  if (!tournament) redirect("/dashboard");

  const [members, matchdays] = await Promise.all([
    prisma.tournamentMember.findMany({
      where: { tournamentId },
      orderBy: [{ joinedAt: "asc" }],
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.matchday.findMany({
      where: { tournamentId },
      orderBy: [{ number: "desc" }],
      select: { id: true, number: true, closesAtUtc: true },
    }),
  ]);

  const nowIso = new Date().toISOString();
  const nowMs = new Date(nowIso).getTime();

  const matchdayRows = matchdays.map((m) => {
    const closesIso = m.closesAtUtc.toISOString();
    return {
      id: m.id,
      number: m.number,
      closesAtUtc: closesIso,
      closesAtLabel: formatUtcShort(closesIso),
      isClosed: nowMs >= m.closesAtUtc.getTime(),
    };
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Users className="h-4 w-4" />
          <span className="text-sm">Torneo</span>
        </div>
        <h1 className="text-2xl font-semibold">Picks por participante</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Selecciona un participante y luego una jornada cerrada para ver sus picks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Participantes
          </CardTitle>
          <CardDescription>Las jornadas se habilitan después del cierre (UTC).</CardDescription>
        </CardHeader>
        <CardContent>
          <TournamentPicksIndexClient
            tournamentId={tournamentId}
            members={members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              role: m.role,
            }))}
            matchdays={matchdayRows}
          />
        </CardContent>
      </Card>
    </main>
  );
}

