import type { Metadata } from "next";
import { Ticket } from "lucide-react";

import { PageIntro } from "@/components/app/page-intro";
import { JoinTournamentClient } from "./join-tournament-client";

export const metadata: Metadata = {
  title: "Unirme a un torneo",
};

export default async function JoinTournamentPage(props: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await props.searchParams;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <PageIntro
        title="Unirme a un torneo"
        description="Pega el token que te compartió el organizador."
        eyebrow={
          <>
          <Ticket className="size-4" />
          <span className="text-sm">Invitaciones</span>
          </>
        }
      />

      <JoinTournamentClient initialToken={token} />
    </main>
  );
}
