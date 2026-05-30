"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Outcome = "HOME" | "DRAW" | "AWAY";

type MatchRow = {
  id: string;
  externalFixtureId: number | null;
  startsAtUtc: string;
  homeTeam: string;
  awayTeam: string;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
  myPick: Outcome | null;
};

export function MatchdayClient(props: {
  matchdayId: string;
  initial: {
    role: "OWNER" | "ORGANIZER" | "PLAYER";
    matchday: { id: string; number: number; closesAtUtc: string };
    matches: MatchRow[];
  };
}) {
  const [rows, setRows] = useState<MatchRow[]>(props.initial.matches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [fixtureId, setFixtureId] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLeague, setSearchLeague] = useState("");
  const [selectedLeagueLabel, setSelectedLeagueLabel] = useState<string | null>(null);
  const [searchSeason, setSearchSeason] = useState(String(new Date().getUTCFullYear()));
  const [searchDate, setSearchDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchMode, setSearchMode] = useState<"date" | "range">("date");
  const [searchFrom, setSearchFrom] = useState(new Date().toISOString().slice(0, 10));
  const [searchTo, setSearchTo] = useState(new Date().toISOString().slice(0, 10));
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string }>>([]);
  const [leagueQuery, setLeagueQuery] = useState("");
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [leagueResults, setLeagueResults] = useState<
    Array<{ id: number; name: string; type: string; countryName: string; seasonYears: number[]; currentSeasons: number[] }>
  >([]);

  function toLocalDateTimeInputValue(date: Date) {
    const tzOffsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  }

  const closesAtMs = useMemo(() => new Date(props.initial.matchday.closesAtUtc).getTime(), [props.initial.matchday.closesAtUtc]);
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const isClosed = useMemo(() => nowMs >= closesAtMs, [nowMs, closesAtMs]);
  const canManage = useMemo(() => props.initial.role === "OWNER" || props.initial.role === "ORGANIZER", [props.initial.role]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/matchdays/${props.matchdayId}/detail`, { cache: "no-store" });
    const data = (await res.json()) as { matches?: MatchRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar partidos");
    setRows(data.matches ?? []);
  }

  async function runSearch() {
    setSearchError(null);
    setSearchLoading(true);
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
    const data = (await res.json().catch(() => ({}))) as {
      fixtures?: Array<{ id: number; dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string }>;
      error?: string;
    };
    setSearchLoading(false);
    if (!res.ok) return setSearchError(data.error ?? "No se pudo buscar fixtures.");
    setSearchResults(data.fixtures ?? []);
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
    const data = (await res.json().catch(() => ({}))) as {
      leagues?: Array<{ id: number; name: string; type: string; countryName: string; seasonYears: number[]; currentSeasons: number[] }>;
      error?: string;
    };
    setLeagueLoading(false);
    if (!res.ok) return setLeagueError(data.error ?? "No se pudo buscar ligas.");
    setLeagueResults(data.leagues ?? []);
  }

  async function pick(matchId: string, outcome: Outcome) {
    setMessage(null);
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/matches/${matchId}/pick`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo guardar el pick");
    setRows((prev) => prev.map((m) => (m.id === matchId ? { ...m, myPick: outcome } : m)));
    setMessage("Pick guardado.");
  }

  return (
    <div className="flex flex-col gap-4">
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{rows.length} partido(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refrescar
        </Button>
      </div>

      {canManage ? (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Agregar partido</CardTitle>
              <CardDescription>Usa un fixture de API-Football (recomendado) o captúralo manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fixture">API-Football Fixture ID (opcional)</Label>
              <Input
                id="fixture"
                inputMode="numeric"
                placeholder="123456"
                value={fixtureId}
                onChange={(e) => setFixtureId(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  className="w-fit"
                  size="sm"
                  variant="outline"
                  disabled={loading || !fixtureId.trim()}
                  type="button"
                  onClick={async () => {
                    setMessage(null);
                    setError(null);
                    setLoading(true);
                    const res = await fetch(`/api/api-football/fixtures/${encodeURIComponent(fixtureId.trim())}`, { cache: "no-store" });
                    const data = (await res.json()) as {
                      fixture?: { dateUtc: string; homeTeam: string; awayTeam: string; statusShort: string };
                      error?: string;
                    };
                    setLoading(false);
                    if (!res.ok) return setError(data.error ?? "No se pudo consultar el fixture");
                    if (!data.fixture) return setError("Fixture no encontrado");
                    const dateUtc = new Date(data.fixture.dateUtc);
                    setStartsAtLocal(toLocalDateTimeInputValue(dateUtc));
                    setHomeTeam(data.fixture.homeTeam);
                    setAwayTeam(data.fixture.awayTeam);
                    setMessage(`Fixture cargado (estado: ${data.fixture.statusShort}).`);
                  }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Autollenar
                </Button>

                <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" type="button">
                      Buscar fixture
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buscar fixtures</DialogTitle>
                      <DialogDescription>Filtra por liga, temporada y fecha. Selecciona un partido para autollenar.</DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="leagueSearch">Buscar liga / competencia</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="leagueSearch"
                            placeholder="Ej. Liga MX, Premier, Mexico..."
                            value={leagueQuery}
                            onChange={(e) => setLeagueQuery(e.target.value)}
                          />
                          <Button
                            className="sm:w-fit"
                            type="button"
                            variant="outline"
                            onClick={runLeagueSearch}
                            disabled={leagueLoading || leagueQuery.trim().length < 3}
                          >
                            {leagueLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Buscar liga
                          </Button>
                        </div>
                        {leagueError ? <p className="text-sm text-red-600">{leagueError}</p> : null}
                      </div>

                      {leagueResults.length > 0 ? (
                        <div className="max-h-[30vh] overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
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
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
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
                          <Button
                            type="button"
                            size="sm"
                            variant={searchMode === "date" ? "default" : "outline"}
                            onClick={() => setSearchMode("date")}
                          >
                            Día exacto
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={searchMode === "range" ? "default" : "outline"}
                            onClick={() => setSearchMode("range")}
                          >
                            Rango
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

                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={runSearch}
                        disabled={
                          searchLoading ||
                          !searchLeague.trim() ||
                          !searchSeason.trim() ||
                          (searchMode === "date" ? !searchDate.trim() : !searchFrom.trim() || !searchTo.trim())
                        }
                      >
                        {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Buscar
                      </Button>
                      {searchError ? <p className="text-sm text-red-600">{searchError}</p> : null}
                    </div>

                    <div className="mt-4 max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
                      {searchResults.length === 0 ? (
                        <p className="p-2 text-sm text-zinc-600 dark:text-zinc-400">Sin resultados.</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {searchResults.map((f) => (
                            <li key={f.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {f.homeTeam} vs {f.awayTeam}
                                  </p>
                                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Fixture {f.id} • {f.statusShort} • {new Date(f.dateUtc).toISOString().replace("T", " ").slice(0, 16)} UTC
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
                                    setSearchOpen(false);
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
                  </DialogContent>
                </Dialog>
              </div>
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

              <Button
                className="w-fit"
                disabled={loading || !startsAtLocal || !homeTeam.trim() || !awayTeam.trim()}
                type="button"
                onClick={async () => {
                  setMessage(null);
                  setError(null);
                  setLoading(true);
                  const startsAtUtc = new Date(startsAtLocal).toISOString();
                  const externalFixtureId = fixtureId.trim() ? Number(fixtureId) : undefined;
                  const res = await fetch(`/api/matchdays/${props.matchdayId}/matches`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ startsAtUtc, homeTeam, awayTeam, externalFixtureId }),
                  });
                  const data = (await res.json()) as { error?: string };
                  setLoading(false);
                  if (!res.ok) return setError(data.error ?? "No se pudo crear el partido");
                  setFixtureId("");
                  setStartsAtLocal("");
                  setHomeTeam("");
                  setAwayTeam("");
                  await refresh();
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agregar partido
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}

      <div className="grid gap-3">
        {rows.map((m) => (
          <div key={m.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.homeTeam} vs {m.awayTeam}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Inicio (UTC): {new Date(m.startsAtUtc).toISOString().replace("T", " ").slice(0, 16)} • Estado: {m.statusShort}
                  {m.scoreHome != null && m.scoreAway != null ? ` • ${m.scoreHome}-${m.scoreAway}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={m.myPick === "HOME" ? "secondary" : "outline"} disabled={loading || isClosed} type="button" onClick={() => pick(m.id, "HOME")}>
                  1
                </Button>
                <Button size="sm" variant={m.myPick === "DRAW" ? "secondary" : "outline"} disabled={loading || isClosed} type="button" onClick={() => pick(m.id, "DRAW")}>
                  X
                </Button>
                <Button size="sm" variant={m.myPick === "AWAY" ? "secondary" : "outline"} disabled={loading || isClosed} type="button" onClick={() => pick(m.id, "AWAY")}>
                  2
                </Button>
              </div>
            </div>
            {m.myPick ? <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Tu pick: {m.myPick}</p> : null}
          </div>
        ))}
      </div>

      {isClosed ? <p className="text-sm text-zinc-600 dark:text-zinc-400">La jornada está cerrada.</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
