import { Ticket } from "lucide-react";

import { JoinTournamentClient } from "./join-tournament-client";

export default function JoinTournamentPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Ticket className="h-4 w-4" />
          <span className="text-sm">Invitaciones</span>
        </div>
        <h1 className="text-2xl font-semibold">Unirme a un torneo</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Pega el token que te compartió el organizador.</p>
      </div>

      <JoinTournamentClient />
    </main>
  );
}

