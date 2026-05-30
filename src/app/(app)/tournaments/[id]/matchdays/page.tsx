import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchdaysClient } from "./MatchdaysClient";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";

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
    select: { name: true },
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
          <AppBreadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Torneos", href: "/tournaments" },
              { label: tournament.name, href: `/tournaments/${tournamentId}` },
              { label: "Jornadas" },
            ]}
          />
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">Jornadas</span>
          </div>
          <h1 className="text-2xl font-semibold">{tournament.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Elige una jornada para hacer tus picks.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/tournaments/${tournamentId}`}>
              <ArrowLeft className="h-4 w-4" />
              Torneo
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Las jornadas se cierran por horario (UTC).</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchdaysClient tournamentId={tournamentId} role={membership.role} initial={initial} />
        </CardContent>
      </Card>
    </main>
  );
}
