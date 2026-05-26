"use client";

import { useEffect } from "react";

import { supabase } from "@/lib/supabase/client";

export function useStandingsRealtime(tournamentId: string, onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`standings:${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Standing",
          filter: `tournamentId=eq.${tournamentId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tournamentId, onChange]);
}

