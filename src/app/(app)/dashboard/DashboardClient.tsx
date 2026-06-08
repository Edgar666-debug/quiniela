"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, KeyRound, LayoutDashboard, PlusCircle, Ticket, Trophy, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { canEditTournament, canManageTournament } from "@/lib/permissions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MyTournament = {
  tournamentId: string;
  name: string;
  logoUrl?: string | null;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
};

export function DashboardClient(props: { initialTournaments: MyTournament[] }) {
  const lastTournament = props.initialTournaments[0] ?? null;
  const managedTournaments = props.initialTournaments.filter((t) => canManageTournament(t.role));

  return (
    <div className="flex flex-col gap-8">
      {managedTournaments.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Gestión</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Torneos donde puedes administrar jornadas y participantes.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {managedTournaments.slice(0, 4).map((t) => (
              <FeatureCard
                key={t.tournamentId}
                href={`/tournaments/${t.tournamentId}/manage`}
                icon={<LayoutDashboard className="size-6 text-emerald-600" />}
                title={`Gestionar “${t.name}”`}
                description={
                  canEditTournament(t.role)
                    ? "Jornadas, invitaciones, participantes y enlace a editar torneo."
                    : "Jornadas, invitaciones y participantes."
                }
                badge={<TournamentBadge name={t.name} logoUrl={t.logoUrl} />}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Accesos rápidos</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FeatureCard 
            href="/tournaments/new"
            icon={<PlusCircle className="size-6 text-emerald-600" />}
            title="Crear torneo"
            description="Crea un torneo, define jornadas y comparte invitaciones."
          />
          <FeatureCard
            href="/tournaments/join"
            icon={<Ticket className="size-6 text-emerald-600" />}
            title="Unirme por invitación"
            description="Pega el token de invitación y entra a un torneo."
          />
          <FeatureCard
            href="/tournaments"
            icon={<Trophy className="size-6 text-emerald-600" />}
            title="Mis torneos"
            description="Abre un torneo y navega a jornadas, picks y ranking en vivo."
          />
          <FeatureCard
            href={lastTournament ? `/tournaments/${lastTournament.tournamentId}/matchdays` : "/tournaments"}
            icon={<CalendarDays className="size-6 text-emerald-600" />}
            title={lastTournament ? "Continuar torneo" : "Jornadas"}
            description={
              lastTournament ? `Ir a jornadas de “${lastTournament.name}”.` : "Selecciona un torneo para ver sus jornadas."
            }
            badge={lastTournament ? <TournamentBadge name={lastTournament.name} logoUrl={lastTournament.logoUrl} /> : null}
          />
          <FeatureCard
            href={lastTournament ? `/tournaments/${lastTournament.tournamentId}/standings` : "/tournaments"}
            icon={<Users className="size-6 text-emerald-600" />}
            title="Ranking en vivo"
            description="Consulta el ranking y empates (múltiples ganadores)."
            badge={lastTournament ? <TournamentBadge name={lastTournament.name} logoUrl={lastTournament.logoUrl} /> : null}
          />
          <FeatureCard
            href="/account/passkeys"
            icon={<KeyRound className="size-6 text-emerald-600" />}
            title="Passkeys"
            description="Entra sin contraseña usando passkey (WebAuthn)."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard(props: { href: string; icon: React.ReactNode; title: string; description: string; badge?: React.ReactNode }) {
  return (
    <Link href={props.href} className="group">
      <Card
        className={cn(
          "h-full border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40",
        )}
      >
        <CardHeader className="flex-row gap-4 space-y-0">
          <div className="mt-0.5 shrink-0">{props.icon}</div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base">{props.title}</CardTitle>
            <CardDescription className="text-sm">{props.description}</CardDescription>
            {props.badge}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

function TournamentBadge(props: { name: string; logoUrl?: string | null }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
      <span className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
        {props.logoUrl ? (
          <Image src={props.logoUrl} alt="" width={20} height={20} className="h-full w-full object-cover" unoptimized />
        ) : (
          <Trophy className="size-3 text-zinc-500" />
        )}
      </span>
      <span className="max-w-44 truncate">{props.name}</span>
    </div>
  );
}
