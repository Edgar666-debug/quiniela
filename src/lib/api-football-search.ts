import { fetchJsonOrThrow } from "@/lib/http";

export async function searchApiFootballLeagues<T>(query: string, fallbackError = "No se pudo buscar ligas.") {
  const data = await fetchJsonOrThrow<{ leagues?: T[] }>(
    `/api/api-football/leagues/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
    fallbackError,
  );

  return data.leagues ?? [];
}

export async function searchApiFootballTeams<T>(query: string, fallbackError = "No se pudo buscar equipos.") {
  const data = await fetchJsonOrThrow<{ teams?: T[] }>(
    `/api/api-football/teams/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
    fallbackError,
  );

  return data.teams ?? [];
}
