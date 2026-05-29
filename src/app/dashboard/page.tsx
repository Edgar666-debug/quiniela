import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const memberships = await prisma.tournamentMember.findMany({
    where: { userId: session.user.id },
    select: { role: true, tournament: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-zinc-600">Sesión activa: {session.user.email}</p>
      <DashboardClient
        initialTournaments={memberships.map((m) => ({
          tournamentId: m.tournament.id,
          name: m.tournament.name,
          role: m.role,
        }))}
      />
      <form
        action={async () => {
          "use server";
          await auth.api.signOut({ headers: await headers() });
          redirect("/");
        }}
      >
        <button className="w-fit rounded-md border px-4 py-2 text-sm font-medium" type="submit">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
