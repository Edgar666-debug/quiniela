"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { Button } from "@/components/ui/button";
import { sendJsonRequest } from "@/lib/http";

type SyncLiveResponse = {
  checkedMatches?: number;
  updatedMatches?: number;
  tournamentsRecalculated?: number;
  durationMs?: number;
  quotaSkipped?: boolean;
  quotaMessage?: string;
  planTier?: "free" | "pro";
  error?: string;
};

export function SyncLiveButton(props: { tournamentId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { response, data } = await sendJsonRequest<SyncLiveResponse>(`/api/tournaments/${props.tournamentId}/sync-live`, { method: "POST" });

      if (!response.ok) {
        setError(data.error ?? "No se pudo sincronizar resultados.");
        return;
      }

      const checked = data.checkedMatches ?? 0;
      const updated = data.updatedMatches ?? 0;

      if (data.quotaSkipped) {
        setError(data.quotaMessage ?? "Sincronización pospuesta por cuota de API-Football.");
        return;
      }

      setMessage(
        updated > 0
          ? `Sincronización lista: ${updated} partido(s) actualizado(s) de ${checked} revisado(s).`
          : `Sincronización lista: ${checked} partido(s) revisado(s), sin cambios.`,
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "No se pudo sincronizar resultados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void runSync()}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        Sincronizar
      </Button>
      <FeedbackAlerts message={message} error={error} />
    </div>
  );
}
