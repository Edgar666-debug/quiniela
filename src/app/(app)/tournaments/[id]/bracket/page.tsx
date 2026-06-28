import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Trophy } from "lucide-react";

import { LocalDateTimeText } from "@/components/app/local-date-time";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentScopeBadge } from "@/components/tournaments/tournament-scope-badge";
import { auth } from "@/lib/auth";
import { statusLabel } from "@/lib/football";
import { prisma } from "@/lib/prisma";
import { buildTournamentBracket, type BracketMatch } from "@/lib/tournament-bracket";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Llave",
};

export default async function TournamentBracketPage(props: { params: Promise<{ id: string }> }) {
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
    select: {
      name: true,
      logoUrl: true,
      scope: true,
      externalLeagueId: true,
      leagueName: true,
      leagueSeason: true,
    },
  });
  if (!tournament) redirect("/dashboard");
  if (tournament.scope !== "SINGLE_LEAGUE") redirect(`/tournaments/${tournamentId}`);

  const matches = await prisma.match.findMany({
    where: { matchday: { tournamentId } },
    orderBy: [{ startsAtUtc: "asc" }],
    select: {
      id: true,
      externalFixtureId: true,
      startsAtUtc: true,
      homeTeam: true,
      awayTeam: true,
      homeLogoUrl: true,
      awayLogoUrl: true,
      statusShort: true,
      scoreHome: true,
      scoreAway: true,
    },
  });

  const bracket = await buildTournamentBracket(matches);
  const scopeMeta = (
    <div className="mt-2 flex flex-wrap gap-2">
      <TournamentScopeBadge tournament={tournament} />
    </div>
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Llave"
        meta={scopeMeta}
      />

      {!bracket.available ? (
        <Card>
          <CardHeader>
            <CardTitle>Llave no disponible</CardTitle>
            <CardDescription>{bracket.reason}</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-ui text-sm">
            {bracket.omittedCount > 0
              ? `${bracket.omittedCount} partido${bracket.omittedCount === 1 ? "" : "s"} quedó fuera porque no tiene fixture o ronda compatible.`
              : "Agrega partidos knockout de esta competición para ver la llave aquí."}
          </CardContent>
        </Card>
      ) : (
        <>  

          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-max auto-cols-[18rem] grid-flow-col gap-4">
              {bracket.rounds.map((round, index) => (
                <section key={round.key} className="space-y-4" style={{ paddingTop: `${index * 2.5}rem` }}>
                  <div className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/30">
                    <p className="text-sm font-medium">{round.label}</p>
                    <p className="text-muted-ui text-xs">{round.matches.length} partido{round.matches.length === 1 ? "" : "s"}</p>
                  </div>

                  <div className="space-y-4">
                    {round.matches.map((match) => (
                      <Card key={match.id}>
                        <CardContent className="space-y-3 px-4 py-4">
                          <TeamRow
                            name={match.homeTeam}
                            logoUrl={match.homeLogoUrl}
                            score={match.scoreHome}
                            highlight={didWin(match, "home")}
                          />
                          <TeamRow
                            name={match.awayTeam}
                            logoUrl={match.awayLogoUrl}
                            score={match.scoreAway}
                            highlight={didWin(match, "away")}
                          />

                          <div className="text-muted-ui border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
                            <div>{statusLabel(match.statusShort)}</div>
                            <LocalDateTimeText iso={match.startsAtUtc.toISOString()} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function TeamRow(props: { name: string; logoUrl: string | null; score: number | null; highlight: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-1.5", props.highlight && "bg-emerald-50 dark:bg-emerald-950/20")}>
      <div className="flex min-w-0 items-center gap-2">
        {props.logoUrl ? (
          <Image src={props.logoUrl} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" unoptimized />
        ) : (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Trophy className="size-3 text-zinc-500" />
          </div>
        )}
        <span className={cn("truncate text-sm", props.highlight && "font-semibold")}>{props.name}</span>
      </div>
      <span className={cn("text-sm tabular-nums text-zinc-500", props.score != null && "text-foreground", props.highlight && "font-semibold")}>
        {props.score ?? "-"}
      </span>
    </div>
  );
}

function didWin(match: BracketMatch, side: "home" | "away") {
  if (match.scoreHome == null || match.scoreAway == null) return false;
  if (match.scoreHome === match.scoreAway) return false;
  return side === "home" ? match.scoreHome > match.scoreAway : match.scoreAway > match.scoreHome;
}
