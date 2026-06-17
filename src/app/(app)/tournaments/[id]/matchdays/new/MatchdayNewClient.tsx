"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { MatchdayFormFields } from "@/components/matchdays/matchday-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendJsonRequest } from "@/lib/http";
import { datetimeLocalToIso } from "@/lib/matchday-form";
import { pushAndRefresh } from "@/lib/navigation";

export function MatchdayNewClient(props: { tournamentId: string }) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [closesAtLocal, setClosesAtLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createMatchday() {
    setError(null);
    setLoading(true);

    try {
      const closesAtUtc = datetimeLocalToIso(closesAtLocal);
      const { response, data } = await sendJsonRequest<{ error?: string }>(`/api/tournaments/${props.tournamentId}/matchdays`, {
        method: "POST",
        body: { number: Number(number), closesAtUtc },
      });

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la jornada");
        return;
      }

      pushAndRefresh(router, `/tournaments/${props.tournamentId}/matchdays`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear la jornada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Crear jornada</h1>
          <p className="text-muted-ui text-sm">Define el número y el cierre en tu hora local.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
          <CardDescription>El cierre es el “cutoff” para picks. Se usa para bloquear edición y picks.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <MatchdayFormFields
            number={number}
            closesAtLocal={closesAtLocal}
            onNumberChange={setNumber}
            onClosesAtChange={setClosesAtLocal}
          />

          <FeedbackAlerts error={error} />

          <div className="flex flex-wrap gap-2">
            <Button disabled={loading || !number.trim() || !closesAtLocal} type="button" onClick={() => void createMatchday()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear jornada
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
