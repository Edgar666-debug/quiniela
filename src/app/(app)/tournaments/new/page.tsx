import type { Metadata } from "next";
import { Trophy } from "lucide-react";

import { PageIntro } from "@/components/app/page-intro";
import { NewTournamentClient } from "./new-tournament-client";

export const metadata: Metadata = {
  title: "Crear torneo",
};

export default function NewTournamentPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <PageIntro
        title="Crear torneo"
        description="Crea un torneo e invita hasta 10 participantes."
        eyebrow={
          <>
          <Trophy className="size-4" />
          <span className="text-sm">Torneos</span>
          </>
        }
      />

      <NewTournamentClient />
    </main>
  );
}
