import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { createSupabaseRealtimeToken } from "@/lib/supabase/realtime-token";
import { StandingsLive } from "./StandingsLive";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Ranking",
};

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
    select: { name: true, logoUrl: true },
  });
  if (!tournament) redirect("/dashboard");

  const [initial, lastSync] = await Promise.all([
    prisma.standing.findMany({
      where: { tournamentId },
      orderBy: [{ points: "desc" }, { updatedAt: "desc" }],
      select: {
        points: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.syncRun.findFirst({
      where: { tournamentId },
      orderBy: [{ ranAtUtc: "desc" }],
      select: { ranAtUtc: true, checkedMatches: true, updatedMatches: true, standingsRecalculated: true },
    }),
  ]);

  const realtimeToken = createSupabaseRealtimeToken(session.user.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Ranking"
        description="Ranking en vivo"
      />

      <Card>
        <CardHeader>
          <CardTitle>Sincronización</CardTitle>
          <CardDescription>Estado de la última sincronización de fixtures.</CardDescription>
        </CardHeader>
        <CardContent>
          {lastSync ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Última sync (UTC): {lastSync.ranAtUtc.toISOString().replace("T", " ").slice(0, 16)} • Checked: {lastSync.checkedMatches} • Updated:{" "}
              {lastSync.updatedMatches} • Standings: {lastSync.standingsRecalculated ? "recalculados" : "sin cambios"}
            </p>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Aún no hay sincronizaciones registradas.</p>
          )}
        </CardContent>
      </Card>

      <StandingsLive tournamentId={tournamentId} initial={initial} realtimeToken={realtimeToken} />
    </main>
  );
}
