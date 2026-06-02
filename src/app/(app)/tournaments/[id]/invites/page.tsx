import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Ticket } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitesClient } from "./invites-client";

export const metadata: Metadata = {
  title: "Invitaciones",
};

export default async function TournamentInvitesPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) redirect("/dashboard");
  if (membership.role !== "OWNER" && membership.role !== "ORGANIZER") redirect(`/tournaments/${tournamentId}`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, status: true },
  });
  if (!tournament) redirect("/dashboard");

  const invites = await prisma.invite.findMany({
    where: { tournamentId },
    orderBy: [{ createdAt: "desc" }],
    select: { token: true, maxUses: true, uses: true, expiresAt: true, createdAt: true },
    take: 20,
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Ticket className="size-4" />
            <span className="text-sm">Invitaciones</span>
          </div>
          <h1 className="text-2xl font-semibold">{tournament.name}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Genera tokens para invitar participantes (máx. 10).</p>
        </div>
      </div>

      <InvitesClient tournamentId={tournamentId} tournamentStatus={tournament.status} initialInvites={invites.map(serializeInvite)} />

      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
          <CardDescription>Buenas prácticas para compartir tokens.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
          Comparte el token por un canal privado. Si sospechas que se filtró, genera uno nuevo y deja de compartir el anterior.
        </CardContent>
      </Card>
    </main>
  );
}

function serializeInvite(i: { token: string; maxUses: number; uses: number; expiresAt: Date | null; createdAt: Date }) {
  return {
    token: i.token,
    maxUses: i.maxUses,
    uses: i.uses,
    expiresAtUtc: i.expiresAt ? i.expiresAt.toISOString() : null,
    createdAtUtc: i.createdAt.toISOString(),
  };
}
