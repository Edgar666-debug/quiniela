"use client";

import { useEffect, useRef } from "react";

import { supabase } from "@/lib/supabase/client";

export function useStandingsRealtime(tournamentId: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!tournamentId) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const ensureRealtimeAuth = async () => {
      const res = await fetch("/api/supabase/realtime-token", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return;
      if (cancelled) return;
      supabase.realtime.setAuth(data.token);
    };

    const setup = async () => {
      await ensureRealtimeAuth();
      if (cancelled) return;

      channel = supabase
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

      if (cancelled && channel) {
        void channel.unsubscribe();
        void supabase.removeChannel(channel);
        channel = null;
      }
    };

    void setup();

    return () => {
      cancelled = true;
      if (channel) {
        void channel.unsubscribe();
        void supabase.removeChannel(channel);
      }
    };
  }, [tournamentId]);
}
