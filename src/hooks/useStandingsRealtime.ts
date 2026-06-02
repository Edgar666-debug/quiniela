"use client";

import { useEffect, useRef } from "react";

import { supabase } from "@/lib/supabase/client";

export function useStandingsRealtime(tournamentId: string, realtimeToken: string | null, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!tournamentId || !realtimeToken) return;

    supabase.realtime.setAuth(realtimeToken);

    const channel = supabase
      .channel(`standings:${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Standing",
          filter: `tournamentId=eq.${tournamentId}`,
        },
        () => onChangeRef.current(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Standing",
          filter: `tournamentId=eq.${tournamentId}`,
        },
        () => onChangeRef.current(),
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [tournamentId, realtimeToken]);
}
