"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { InlineAlert } from "@/components/app/inline-alert";
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

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Crear jornada</h1>
          <p className="text-muted-ui text-sm">Define el número y el cierre (se guarda en UTC).</p>
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

          {error ? <InlineAlert variant="error" message={error} /> : null}

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={loading || !number.trim() || !closesAtLocal}
              type="button"
              onClick={async () => {
                setError(null);
                setLoading(true);
                const closesAtUtc = datetimeLocalToIso(closesAtLocal);
                const { response, data } = await sendJsonRequest<{ error?: string }>(
                  `/api/tournaments/${props.tournamentId}/matchdays`,
                  { method: "POST", body: { number: Number(number), closesAtUtc } },
                );
                setLoading(false);
                if (!response.ok) return setError(data.error ?? "No se pudo crear la jornada");
                pushAndRefresh(router, `/tournaments/${props.tournamentId}/matchdays`);
              }}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear jornada
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
