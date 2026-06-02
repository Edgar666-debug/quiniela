"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InlineAlert } from "@/components/app/inline-alert";
import { statusLabel } from "@/lib/football";

type LeagueRow = { id: number; name: string; type: string; countryName: string; seasonYears: number[]; currentSeasons: number[] };
type FixtureRow = { id: number; dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string };

function toLocalDateTimeInputValue(date: Date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

const DAY_MS = 24 * 60 * 60_000;

function createDefaultSearchDates() {
  const now = Date.now();
  return {
    seasonYear: String(new Date(now).getUTCFullYear()),
    date: new Date(now).toISOString().slice(0, 10),
    from: new Date(now - 7 * DAY_MS).toISOString().slice(0, 10),
    to: new Date(now + 7 * DAY_MS).toISOString().slice(0, 10),
  };
}

export function MatchNewClient(props: {
  tournamentId: string;
  matchdayId: string;
  matchdayNumber: number;
  matchdayClosesAtUtc: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
}) {
  const router = useRouter();
  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";
  const closesAtMs = new Date(props.matchdayClosesAtUtc).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const isClosed = nowMs >= closesAtMs;

  const [fixtureId, setFixtureId] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [leagueQuery, setLeagueQuery] = useState("");
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [leagueResults, setLeagueResults] = useState<LeagueRow[]>([]);
  const [searchLeague, setSearchLeague] = useState("");
  const [selectedLeagueLabel, setSelectedLeagueLabel] = useState<string | null>(null);
  const [defaultSearch] = useState(createDefaultSearchDates);
  const [searchSeason, setSearchSeason] = useState(defaultSearch.seasonYear);
  const [searchMode, setSearchMode] = useState<"date" | "range">("range");
  const [searchDate, setSearchDate] = useState(defaultSearch.date);
  const [searchFrom, setSearchFrom] = useState(defaultSearch.from);
  const [searchTo, setSearchTo] = useState(defaultSearch.to);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState<FixtureRow[]>([]);

  const startsAtUtcMs = (() => {
    if (!startsAtLocal) return null;
    const d = new Date(startsAtLocal);
    const t = d.getTime();
    return Number.isNaN(t) ? null : t;
  })();
  const violatesCloseRule = startsAtUtcMs != null ? startsAtUtcMs < closesAtMs : false;

  if (!canManage) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sin permisos</CardTitle>
            <CardDescription>Solo OWNER/ORGANIZER pueden agregar partidos.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  async function runLeagueSearch() {
    const q = leagueQuery.trim();
    setLeagueError(null);
    setLeagueResults([]);
    if (q.length < 3) {
      setLeagueError("Escribe al menos 3 caracteres para buscar.");
      return;
    }

    setLeagueLoading(true);
    const params = new URLSearchParams();
    params.set("q", q);
    params.set("limit", "15");
    const res = await fetch(`/api/api-football/leagues/search?${params.toString()}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { leagues?: LeagueRow[]; error?: string };
    setLeagueLoading(false);
    if (!res.ok) return setLeagueError(data.error ?? "No se pudo buscar ligas.");
    setLeagueResults(data.leagues ?? []);
  }

  async function runFixturesSearch() {
    setFixturesError(null);
    setFixturesLoading(true);
    const params = new URLSearchParams();
    if (searchLeague.trim()) params.set("league", searchLeague.trim());
    if (searchSeason.trim()) params.set("season", searchSeason.trim());
    if (searchMode === "date") {
      if (searchDate.trim()) params.set("date", searchDate.trim());
    } else {
      if (searchFrom.trim()) params.set("from", searchFrom.trim());
      if (searchTo.trim()) params.set("to", searchTo.trim());
    }
    params.set("limit", "25");

    const res = await fetch(`/api/api-football/fixtures/search?${params.toString()}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { fixtures?: FixtureRow[]; error?: string };
    setFixturesLoading(false);
    if (!res.ok) return setFixturesError(data.error ?? "No se pudo buscar fixtures.");
    setFixtures(data.fixtures ?? []);
  }

  async function loadFixtureById() {
    const id = fixtureId.trim();
    if (!id) return;

    setMessage(null);
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/api-football/fixtures/${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { fixture?: { dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string }; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo consultar el fixture");
    if (!data.fixture) return setError("Fixture no encontrado");

    const dateUtc = new Date(data.fixture.dateUtc);
    setStartsAtLocal(toLocalDateTimeInputValue(dateUtc));
    setHomeTeam(data.fixture.homeTeam);
    setAwayTeam(data.fixture.awayTeam);
    setMessage(`Fixture cargado (estado: ${data.fixture.statusShort}).`);
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <CalendarDays className="size-4" />
            <span className="text-sm">Jornada {props.matchdayNumber}</span>
          </div>
          <h1 className="text-2xl font-semibold">Agregar partido</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Busca fixtures y guarda el partido en la jornada.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1) Buscar liga / competencia</CardTitle>
          <CardDescription>Escribe el nombre de la liga o país y selecciona una opción.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isClosed ? <InlineAlert variant="error" message="La jornada está cerrada. Ya no puedes agregar partidos." /> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Ej. Liga MX, Premier, Mexico..." value={leagueQuery} onChange={(e) => setLeagueQuery(e.target.value)} />
            <Button type="button" variant="outline" onClick={runLeagueSearch} disabled={leagueLoading || leagueQuery.trim().length < 3}>
              {leagueLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Buscar
            </Button>
          </div>
          {leagueError ? <InlineAlert variant="error" message={leagueError} /> : null}

          {leagueResults.length > 0 ? (
            <div className="max-h-[40vh] overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
              <ul className="flex flex-col gap-2">
                {leagueResults.map((l) => {
                  const suggestedSeason = l.currentSeasons[0] ?? l.seasonYears[0];
                  return (
                    <li key={l.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {l.name} <span className="text-zinc-600 dark:text-zinc-400">({l.countryName})</span>
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            League {l.id} • {l.type}
                            {suggestedSeason ? ` • Season sugerida: ${suggestedSeason}` : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => {
                            setSearchLeague(String(l.id));
                            setSelectedLeagueLabel(`${l.name} (${l.countryName})`);
                            if (suggestedSeason) setSearchSeason(String(suggestedSeason));
                          }}
                        >
                          Usar
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="leagueId">League ID</Label>
              <Input id="leagueId" inputMode="numeric" placeholder="ej. 262" value={searchLeague} onChange={(e) => setSearchLeague(e.target.value)} />
              {selectedLeagueLabel ? <p className="text-xs text-zinc-600 dark:text-zinc-400">Seleccionada: {selectedLeagueLabel}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="season">Season</Label>
              <Input id="season" inputMode="numeric" placeholder="2026" value={searchSeason} onChange={(e) => setSearchSeason(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Fecha</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant={searchMode === "range" ? "default" : "outline"} onClick={() => setSearchMode("range")}>
                  Rango
                </Button>
                <Button type="button" size="sm" variant={searchMode === "date" ? "default" : "outline"} onClick={() => setSearchMode("date")}>
                  Día exacto
                </Button>
              </div>
              {searchMode === "date" ? (
                <Input id="date" type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input id="from" type="date" value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} />
                  <Input id="to" type="date" value={searchTo} onChange={(e) => setSearchTo(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={runFixturesSearch}
              disabled={
                fixturesLoading ||
                isClosed ||
                !searchLeague.trim() ||
                !searchSeason.trim() ||
                (searchMode === "date" ? !searchDate.trim() : !searchFrom.trim() || !searchTo.trim())
              }
            >
              {fixturesLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Buscar fixtures
            </Button>
            {fixturesError ? <InlineAlert variant="error" message={fixturesError} /> : null}
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
            {fixtures.length === 0 ? (
              <p className="p-2 text-sm text-zinc-600 dark:text-zinc-400">Sin resultados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fixtures.map((f) => (
                  <li key={f.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {f.homeTeam} vs {f.awayTeam}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Fixture {f.id} • {statusLabel(f.statusShort)} • {new Date(f.dateUtc).toISOString().replace("T", " ").slice(0, 16)} UTC
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setFixtureId(String(f.id));
                          const dateUtc = new Date(f.dateUtc);
                          setStartsAtLocal(toLocalDateTimeInputValue(dateUtc));
                          setHomeTeam(f.homeTeam);
                          setAwayTeam(f.awayTeam);
                          setMessage(`Fixture seleccionado: ${f.id}`);
                        }}
                      >
                        Usar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

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
              <Input id="fixture" inputMode="numeric" placeholder="123456" value={fixtureId} onChange={(e) => setFixtureId(e.target.value)} />
              <Button className="w-fit" size="sm" variant="outline" type="button" disabled={loading || isClosed || !fixtureId.trim()} onClick={loadFixtureById}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Autollenar
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startsAt">Inicio (hora local)</Label>
              <Input id="startsAt" type="datetime-local" value={startsAtLocal} onChange={(e) => setStartsAtLocal(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="home">Local</Label>
              <Input id="home" placeholder="Equipo local" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="away">Visita</Label>
              <Input id="away" placeholder="Equipo visita" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} />
            </div>
          </div>

          <Separator />

          {message ? <InlineAlert variant="success" message={message} /> : null}
          {error ? <InlineAlert variant="error" message={error} /> : null}

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={loading || isClosed || !startsAtLocal || !homeTeam.trim() || !awayTeam.trim()}
              type="button"
              onClick={async () => {
                setMessage(null);
                setError(null);
                if (violatesCloseRule) {
                  return setError(
                    "El inicio del partido está antes del cierre (UTC). Ajusta el cierre de la jornada o elige otro fixture.",
                  );
                }
                setLoading(true);
                const startsAtUtc = new Date(startsAtLocal).toISOString();
                const externalFixtureId = fixtureId.trim() ? Number(fixtureId) : undefined;
                const res = await fetch(`/api/matchdays/${props.matchdayId}/matches`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ startsAtUtc, homeTeam, awayTeam, externalFixtureId }),
                });
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                setLoading(false);
                if (!res.ok) return setError(data.error ?? "No se pudo crear el partido");
                router.push(`/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}`);
                router.refresh();
              }}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Agregar partido
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
