"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InlineAlert } from "@/components/app/inline-alert";
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
  | { type: "apply_fixture"; fixtureId: string; startsAtLocal: string; homeTeam: string; awayTeam: string; message: string }
  | { type: "submit_start" }
  | { type: "submit_fail"; error: string }
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
    case "apply_fixture":
      return {
        ...state,
        fixtureId: action.fixtureId,
        startsAtLocal: action.startsAtLocal,
        homeTeam: action.homeTeam,
        awayTeam: action.awayTeam,
        message: action.message,
        error: null,
      };
    case "submit_start":
    case "load_fixture_start":
      return { ...state, loading: true, error: null, message: null };
    case "submit_fail":
    case "load_fixture_fail":
      return { ...state, loading: false, error: action.error };
    case "load_fixture_ok":
      return {
        ...state,
        loading: false,
        fixtureId: action.fixtureId,
        startsAtLocal: action.startsAtLocal,
        homeTeam: action.homeTeam,
        awayTeam: action.awayTeam,
        message: action.message,
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
  selectedFixture: FixtureSelection | null;
  selectedFixtureKey: number;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, initialFormState);

  useEffect(() => {
    if (!props.selectedFixture) return;
    const f = props.selectedFixture;
    dispatch({
      type: "apply_fixture",
      fixtureId: String(f.id),
      startsAtLocal: toLocalDateTimeInputValue(new Date(f.dateUtc)),
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      message: `Fixture seleccionado: ${f.id}`,
    });
  }, [props.selectedFixtureKey, props.selectedFixture]);

  const startsAtUtcMs = (() => {
    if (!state.startsAtLocal) return null;
    const t = new Date(state.startsAtLocal).getTime();
    return Number.isNaN(t) ? null : t;
  })();
  const violatesCloseRule = startsAtUtcMs != null ? startsAtUtcMs < props.closesAtMs : false;

  async function loadFixtureById() {
    const id = state.fixtureId.trim();
    if (!id) return;

    dispatch({ type: "load_fixture_start" });
    const res = await fetch(`/api/api-football/fixtures/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      fixture?: { dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string };
      error?: string;
    };
    if (!res.ok) return dispatch({ type: "load_fixture_fail", error: data.error ?? "No se pudo consultar el fixture" });
    if (!data.fixture) return dispatch({ type: "load_fixture_fail", error: "Fixture no encontrado" });

    const dateUtc = new Date(data.fixture.dateUtc);
    dispatch({
      type: "load_fixture_ok",
      fixtureId: id,
      startsAtLocal: toLocalDateTimeInputValue(dateUtc),
      homeTeam: data.fixture.homeTeam,
      awayTeam: data.fixture.awayTeam,
      message: `Fixture cargado (estado: ${data.fixture.statusShort}).`,
    });
  }

  async function submitMatch() {
    if (violatesCloseRule) {
      return dispatch({
        type: "submit_fail",
        error: "El inicio del partido está antes del cierre (UTC). Ajusta el cierre de la jornada o elige otro fixture.",
      });
    }

    dispatch({ type: "submit_start" });
    const startsAtUtc = new Date(state.startsAtLocal).toISOString();
    const externalFixtureId = state.fixtureId.trim() ? Number(state.fixtureId) : undefined;
    const res = await fetch(`/api/matchdays/${props.matchdayId}/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        startsAtUtc,
        homeTeam: state.homeTeam,
        awayTeam: state.awayTeam,
        externalFixtureId,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return dispatch({ type: "submit_fail", error: data.error ?? "No se pudo crear el partido" });
    router.push(`/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>2) Confirmar partido</CardTitle>
        <CardDescription>Si quieres, también puedes pegar un Fixture ID y autollenar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {violatesCloseRule ? (
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
              onChange={(e) => dispatch({ type: "set_fixture_id", value: e.target.value })}
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
              onChange={(e) => dispatch({ type: "set_starts_at", value: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="home">Local</Label>
            <Input id="home" placeholder="Equipo local" value={state.homeTeam} onChange={(e) => dispatch({ type: "set_home", value: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="away">Visita</Label>
            <Input id="away" placeholder="Equipo visita" value={state.awayTeam} onChange={(e) => dispatch({ type: "set_away", value: e.target.value })} />
          </div>
        </div>

        <Separator />

        {state.message ? <InlineAlert variant="success" message={state.message} /> : null}
        {state.error ? <InlineAlert variant="error" message={state.error} /> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={state.loading || props.isClosed || !state.startsAtLocal || !state.homeTeam.trim() || !state.awayTeam.trim()}
            type="button"
            onClick={submitMatch}
          >
            {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Agregar partido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
