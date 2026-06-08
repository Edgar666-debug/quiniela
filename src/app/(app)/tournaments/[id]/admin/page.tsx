import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { auth } from "@/lib/auth";
import { canEditTournament } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentAdminClient } from "../tournament-admin-client";

export const metadata: Metadata = {
  title: "Editar torneo",
};

export default async function TournamentAdminPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || !canEditTournament(membership.role)) redirect(`/tournaments/${tournamentId}`);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, logoUrl: true, status: true },
  });
  if (!tournament) redirect("/dashboard");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Editar torneo"
        description="Actualiza la identidad del torneo y controla su ciclo de vida."
      />

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>Nombre, logo y estado del torneo.</CardDescription>
        </CardHeader>
        <CardContent>
          <TournamentAdminClient
            tournamentId={tournamentId}
            status={tournament.status}
            currentName={tournament.name}
            currentLogoUrl={tournament.logoUrl}
          />
        </CardContent>
      </Card>
    </main>
  );
}
