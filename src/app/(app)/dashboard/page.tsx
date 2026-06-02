import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const memberships = await prisma.tournamentMember.findMany({
    where: { userId: session.user.id },
    select: { role: true, tournament: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Sesión activa: {session.user.email}</p>
      </div>

      <DashboardClient
        initialTournaments={memberships.map((m) => ({
          tournamentId: m.tournament.id,
          name: m.tournament.name,
          role: m.role,
        }))}
      />
    </main>
  );
}
