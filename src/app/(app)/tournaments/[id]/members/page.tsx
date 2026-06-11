import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TournamentPageHeader } from "@/components/app/tournament-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MembersClient } from "./MembersClient";

export const metadata: Metadata = {
  title: "Participantes",
};

export default async function TournamentMembersPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { id: tournamentId } = await props.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { id: true, role: true },
  });
  if (!membership) redirect("/dashboard");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { name: true, logoUrl: true },
  });
  if (!tournament) redirect("/dashboard");

  const members = await prisma.tournamentMember.findMany({
    where: { tournamentId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    select: {
      role: true,
      joinedAt: true,
      user: { select: { id: true, email: true, name: true, image: true } },
    },
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <TournamentPageHeader
        name={tournament.name}
        logoUrl={tournament.logoUrl}
        eyebrow="Participantes"
        description={`${members.length} / 10 participantes`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>Roles: OWNER, ORGANIZER, PLAYER.</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersClient
            tournamentId={tournamentId}
            myUserId={session.user.id}
            myRole={membership.role}
            initial={members.map((m) => ({ role: m.role, user: m.user }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
