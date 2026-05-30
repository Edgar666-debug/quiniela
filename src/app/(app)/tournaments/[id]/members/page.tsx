import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TournamentMembersPage(props: { params: Promise<{ id: string }> }) {
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

  const members = await prisma.tournamentMember.findMany({
    where: { tournamentId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    select: {
      role: true,
      joinedAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Users className="h-4 w-4" />
            <span className="text-sm">Participantes</span>
          </div>
          <h1 className="text-2xl font-semibold">{tournament.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{members.length} / 10 participantes</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/tournaments/${tournamentId}`}>
            <ArrowLeft className="h-4 w-4" />
            Torneo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>Roles: OWNER, ORGANIZER, PLAYER.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.map((m) => (
            <div
              key={m.user.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.user.name ?? m.user.email}</p>
                <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{m.user.email}</p>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">{m.role}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
