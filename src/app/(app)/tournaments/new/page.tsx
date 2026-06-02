import type { Metadata } from "next";
import { Trophy } from "lucide-react";

import { NewTournamentClient } from "./new-tournament-client";

export const metadata: Metadata = {
  title: "Crear torneo",
};

export default function NewTournamentPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Trophy className="h-4 w-4" />
          <span className="text-sm">Torneos</span>
        </div>
        <h1 className="text-2xl font-semibold">Crear torneo</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Crea un torneo e invita hasta 10 participantes.</p>
      </div>

      <NewTournamentClient />
    </main>
  );
}
