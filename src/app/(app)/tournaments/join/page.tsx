import type { Metadata } from "next";
import { Ticket } from "lucide-react";

import { JoinTournamentClient } from "./join-tournament-client";

export const metadata: Metadata = {
  title: "Unirme a un torneo",
};

export default function JoinTournamentPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Ticket className="size-4" />
          <span className="text-sm">Invitaciones</span>
        </div>
        <h1 className="text-2xl font-semibold">Unirme a un torneo</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Pega el token que te compartió el organizador.</p>
      </div>

      <JoinTournamentClient />
    </main>
  );
}
