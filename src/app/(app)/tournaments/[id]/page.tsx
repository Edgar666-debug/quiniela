import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TournamentHomePage(props: { params: Promise<{ id: string }> }) {
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

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Trophy className="h-4 w-4" />
            <span className="text-sm">Torneo</span>
          </div>
          <h1 className="text-2xl font-semibold">{tournament.name}</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            Torneos
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ranking</CardTitle>
            <CardDescription>Tabla de posiciones en vivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/tournaments/${tournamentId}/standings`}>
                <Trophy className="h-4 w-4" />
                Ver ranking
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jornadas</CardTitle>
            <CardDescription>Entrar a una jornada para hacer picks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/tournaments/${tournamentId}/matchdays`}>
                <CalendarDays className="h-4 w-4" />
                Ver jornadas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
