import type { Metadata } from "next";
import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Torneos tipo quiniela por invitación, jornadas con cierre y ranking en vivo.",
};

export default function Home() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-zinc-600">
          <Trophy className="h-4 w-4" />
          <span className="text-sm">Quiniela</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Torneos tipo quiniela, simples y rápidos</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Torneos por invitación, jornadas cerradas por horario, 1 punto por acierto (1X2), ranking en vivo.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/sign-in">
              Iniciar sesión <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-up">Crear cuenta</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones</CardTitle>
            <CardDescription>Unirse por token, sin registros complicados.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
            Crea un torneo y genera invitaciones de 1 uso para tus participantes.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jornadas</CardTitle>
            <CardDescription>Un solo cierre por jornada.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
            Todos los picks se bloquean al llegar el horario de cierre (UTC).
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ranking en vivo</CardTitle>
            <CardDescription>Se actualiza al instante.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
            Con Supabase Realtime, los standings se refrescan cuando cambian los puntos.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
