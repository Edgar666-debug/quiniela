"use client";

import { useMemo, useReducer } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { MatchdayFormFields } from "@/components/matchdays/matchday-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendJsonRequest } from "@/lib/http";
import { datetimeLocalToIso, isoToDatetimeLocalValue } from "@/lib/matchday-form";

type EditState = {
  number: string;
  closesAtLocal: string;
  loading: boolean;
  error: string | null;
  message: string | null;
};

type EditAction =
  | { type: "set_number"; value: string }
  | { type: "set_closes_at"; value: string }
  | { type: "save_start" }
  | { type: "save_fail"; error: string }
  | { type: "save_success"; message: string };

function matchdayEditReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case "set_number":
      return { ...state, number: action.value };
    case "set_closes_at":
      return { ...state, closesAtLocal: action.value };
    case "save_start":
      return { ...state, loading: true, error: null, message: null };
    case "save_fail":
      return { ...state, loading: false, error: action.error };
    case "save_success":
      return { ...state, loading: false, message: action.message, error: null };
    default:
      return state;
  }
}

export function MatchdayEditClient(props: {
  tournamentId: string;
  matchdayId: string;
  initialNumber: number;
  initialClosesAtUtc: string;
  matchesCount: number;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(matchdayEditReducer, {
    number: String(props.initialNumber),
    closesAtLocal: isoToDatetimeLocalValue(props.initialClosesAtUtc),
    loading: false,
    error: null,
    message: null,
  });

  const isClosed = useMemo(() => {
    const closesAtMs = new Date(props.initialClosesAtUtc).getTime();
    const nowMs = new Date().getTime();
    return nowMs >= closesAtMs;
  }, [props.initialClosesAtUtc]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar jornada {props.initialNumber}</CardTitle>
        <CardDescription>
          Ajusta el número o la fecha de cierre. {props.matchesCount} partido(s) en esta jornada.
          {isClosed ? " La jornada ya está cerrada; cambiar el cierre puede afectar cuándo se revelan picks." : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <MatchdayFormFields
          number={state.number}
          closesAtLocal={state.closesAtLocal}
          onNumberChange={(value) => dispatch({ type: "set_number", value })}
          onClosesAtChange={(value) => dispatch({ type: "set_closes_at", value })}
          numberId="edit-number"
          closesAtId="edit-closesAt"
        />

        <FeedbackAlerts message={state.message} error={state.error} />

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={state.loading || !state.number.trim() || !state.closesAtLocal}
            type="button"
            onClick={async () => {
              dispatch({ type: "save_start" });
              const { response, data } = await sendJsonRequest<{ error?: string }>(`/api/matchdays/${props.matchdayId}`, {
                method: "PATCH",
                body: {
                  number: Number(state.number),
                  closesAtUtc: datetimeLocalToIso(state.closesAtLocal),
                },
              });
              if (!response.ok) return dispatch({ type: "save_fail", error: data.error ?? "No se pudo actualizar la jornada" });
              dispatch({ type: "save_success", message: "Jornada actualizada." });
              router.refresh();
            }}
          >
            {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar cambios
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href={`/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}`}>Volver a la jornada</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
