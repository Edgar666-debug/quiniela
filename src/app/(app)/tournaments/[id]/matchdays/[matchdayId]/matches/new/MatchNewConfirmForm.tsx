"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatUtcToLocalShort } from "@/lib/format";
import { readJsonResponse, sendJsonRequest } from "@/lib/http";
import { pushAndRefresh } from "@/lib/navigation";
import { toLocalDateTimeInputValue, type FixtureSelection } from "./match-new-types";

type FormState = {
  fixtureId: string;
  startsAtLocal: string;
  homeTeam: string;
  awayTeam: string;
  loading: boolean;
  error: string | null;
  message: string | null;
};

type FormAction =
  | { type: "set_fixture_id"; value: string }
  | { type: "set_starts_at"; value: string }
  | { type: "set_home"; value: string }
  | { type: "set_away"; value: string }
  | { type: "submit_start" }
  | { type: "submit_fail"; error: string }
  | { type: "submit_success"; message: string }
  | { type: "load_fixture_start" }
  | { type: "load_fixture_fail"; error: string }
  | { type: "load_fixture_ok"; fixtureId: string; startsAtLocal: string; homeTeam: string; awayTeam: string; message: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set_fixture_id":
      return { ...state, fixtureId: action.value };
    case "set_starts_at":
      return { ...state, startsAtLocal: action.value };
    case "set_home":
      return { ...state, homeTeam: action.value };
    case "set_away":
      return { ...state, awayTeam: action.value };
    case "submit_start":
    case "load_fixture_start":
      return { ...state, loading: true, error: null, message: null };
    case "submit_fail":
    case "load_fixture_fail":
      return { ...state, loading: false, error: action.error };
    case "submit_success":
      return { ...state, loading: false, error: null, message: action.message };
    case "load_fixture_ok":
      return {
        ...state,
        loading: false,
        fixtureId: action.fixtureId,
        startsAtLocal: action.startsAtLocal,
        homeTeam: action.homeTeam,
        awayTeam: action.awayTeam,
        message: action.message,
        error: null,
      };
    default:
      return state;
  }
}

const initialFormState: FormState = {
  fixtureId: "",
  startsAtLocal: "",
  homeTeam: "",
  awayTeam: "",
  loading: false,
  error: null,
  message: null,
};

export function MatchNewConfirmForm(props: {
  tournamentId: string;
  matchdayId: string;
  closesAtMs: number;
  isClosed: boolean;
  selectedFixtures: FixtureSelection[];
  onRemoveFixture: (fixtureId: number) => void;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, initialFormState);

  const manualStartsAtUtcMs = (() => {
    if (!state.startsAtLocal) return null;
    const time = new Date(state.startsAtLocal).getTime();
    return Number.isNaN(time) ? null : time;
  })();
  const manualViolatesCloseRule = manualStartsAtUtcMs != null ? manualStartsAtUtcMs < props.closesAtMs : false;

  const invalidSelectedFixtures = props.selectedFixtures.filter((fixture) => new Date(fixture.dateUtc).getTime() < props.closesAtMs);
  const canSubmitBatch = !props.isClosed && props.selectedFixtures.length > 0 && invalidSelectedFixtures.length === 0 && !state.loading;

  async function loadFixtureById() {
    const id = state.fixtureId.trim();
    if (!id) return;

    dispatch({ type: "load_fixture_start" });
    const res = await fetch(`/api/api-football/fixtures/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await readJsonResponse<{
      fixture?: { dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string };
      error?: string;
    }>(res);
    if (!res.ok) return dispatch({ type: "load_fixture_fail", error: data.error ?? "No se pudo consultar el fixture" });
    if (!data.fixture) return dispatch({ type: "load_fixture_fail", error: "Fixture no encontrado" });

    dispatch({
      type: "load_fixture_ok",
      fixtureId: id,
      startsAtLocal: toLocalDateTimeInputValue(new Date(data.fixture.dateUtc)),
      homeTeam: data.fixture.homeTeam,
      awayTeam: data.fixture.awayTeam,
      message: `Fixture cargado (estado: ${data.fixture.statusShort}).`,
    });
  }

  async function submitSelectedMatches() {
    dispatch({ type: "submit_start" });
    const { response, data } = await sendJsonRequest<{ error?: string; count?: number }>(`/api/matchdays/${props.matchdayId}/matches`, {
      method: "POST",
      body: {
        matches: props.selectedFixtures.map((fixture) => ({
          externalFixtureId: fixture.id,
          startsAtUtc: fixture.dateUtc,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
        })),
      },
    });
    if (!response.ok) return dispatch({ type: "submit_fail", error: data.error ?? "No se pudieron crear los partidos" });

    dispatch({
      type: "submit_success",
      message: `${data.count ?? props.selectedFixtures.length} partidos agregados correctamente.`,
    });
    pushAndRefresh(router, `/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}`);
  }

  async function submitSingleMatch() {
    if (manualViolatesCloseRule) {
      return dispatch({
        type: "submit_fail",
        error: "El inicio del partido está antes del cierre (UTC). Ajusta el cierre de la jornada o elige otro fixture.",
      });
    }

    dispatch({ type: "submit_start" });
    const startsAtUtc = new Date(state.startsAtLocal).toISOString();
    const externalFixtureId = state.fixtureId.trim() ? Number(state.fixtureId) : undefined;
    const { response, data } = await sendJsonRequest<{ error?: string }>(`/api/matchdays/${props.matchdayId}/matches`, {
      method: "POST",
      body: {
        startsAtUtc,
        homeTeam: state.homeTeam,
        awayTeam: state.awayTeam,
        externalFixtureId,
      },
    });
    if (!response.ok) return dispatch({ type: "submit_fail", error: data.error ?? "No se pudo crear el partido" });

    dispatch({ type: "submit_success", message: "Partido agregado correctamente." });
    pushAndRefresh(router, `/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>2) Confirmar partidos</CardTitle>
        <CardDescription>Selecciona varios fixtures para agregarlos en lote o usa un Fixture ID manual.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {invalidSelectedFixtures.length > 0 ? (
          <InlineAlert
            variant="error"
            message="Uno o más fixtures seleccionados inician antes del cierre de la jornada (UTC). Quítalos o ajusta el cierre."
          />
        ) : null}

        <div className="list-card-ui bg-white dark:bg-zinc-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Selección múltiple</p>
              <p className="text-muted-ui text-xs">
                {props.selectedFixtures.length === 0
                  ? "No hay fixtures seleccionados todavía."
                  : `${props.selectedFixtures.length} fixture${props.selectedFixtures.length === 1 ? "" : "s"} listo${props.selectedFixtures.length === 1 ? "" : "s"} para agregar.`}
              </p>
            </div>
            <Button type="button" disabled={!canSubmitBatch} onClick={submitSelectedMatches}>
              {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar {props.selectedFixtures.length > 0 ? props.selectedFixtures.length : ""} partido{props.selectedFixtures.length === 1 ? "" : "s"}
            </Button>
          </div>

          {props.selectedFixtures.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {props.selectedFixtures.map((fixture) => {
                const violatesCloseRule = new Date(fixture.dateUtc).getTime() < props.closesAtMs;
                return (
                  <li key={fixture.id} className="list-row-ui flex items-center justify-between gap-3 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </p>
                      <p className="text-subtle-ui text-xs">
                        Fixture {fixture.id} · {formatUtcToLocalShort(fixture.dateUtc)}
                      </p>
                      {violatesCloseRule ? (
                        <p className="text-xs text-red-600">Inicia antes del cierre de la jornada.</p>
                      ) : null}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => props.onRemoveFixture(fixture.id)}>
                      <Trash2 className="size-4" />
                      <span className="sr-only">Quitar fixture</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <Separator />

        {manualViolatesCloseRule ? (
          <InlineAlert
            variant="error"
            message="Este partido inicia antes del cierre de la jornada (UTC). Ajusta el cierre para que sea antes del primer partido o elige otro fixture."
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="fixture">API-Football Fixture ID (opcional)</Label>
            <Input
              id="fixture"
              inputMode="numeric"
              placeholder="123456"
              value={state.fixtureId}
              onChange={(event) => dispatch({ type: "set_fixture_id", value: event.target.value })}
            />
            <Button
              className="w-fit"
              size="sm"
              variant="outline"
              type="button"
              disabled={state.loading || props.isClosed || !state.fixtureId.trim()}
              onClick={loadFixtureById}
            >
              {state.loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Autollenar
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startsAt">Inicio (hora local)</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={state.startsAtLocal}
              onChange={(event) => dispatch({ type: "set_starts_at", value: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="home">Local</Label>
            <Input id="home" placeholder="Equipo local" value={state.homeTeam} onChange={(event) => dispatch({ type: "set_home", value: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="away">Visita</Label>
            <Input id="away" placeholder="Equipo visita" value={state.awayTeam} onChange={(event) => dispatch({ type: "set_away", value: event.target.value })} />
          </div>
        </div>

        <Separator />

        <FeedbackAlerts message={state.message} error={state.error} />

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={state.loading || props.isClosed || !state.startsAtLocal || !state.homeTeam.trim() || !state.awayTeam.trim()}
            type="button"
            onClick={submitSingleMatch}
          >
            {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Agregar partido manual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
