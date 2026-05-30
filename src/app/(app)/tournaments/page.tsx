import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";

export default async function TournamentsIndexPage() {
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
        <AppBreadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Torneos" }]} />
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Trophy className="h-4 w-4" />
          <span className="text-sm">Torneos</span>
        </div>
        <h1 className="text-2xl font-semibold">Mis torneos</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Selecciona un torneo para navegar por jornadas y ranking.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/tournaments/new">Crear torneo</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/tournaments/join">Unirme por invitación</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {memberships.length === 0 ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Sin torneos</CardTitle>
              <CardDescription>Crea o únete usando las opciones de arriba o desde el dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">Ir al dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          memberships.map((m) => (
            <Card key={m.tournament.id}>
              <CardHeader>
                <CardTitle className="truncate">{m.tournament.name}</CardTitle>
                <CardDescription>Rol: {m.role}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild>
                  <Link href={`/tournaments/${m.tournament.id}`}>Abrir</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/tournaments/${m.tournament.id}/standings`}>Ranking</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
