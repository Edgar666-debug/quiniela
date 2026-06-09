"use client";

import { useState } from "react";
import { Laptop, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatUtcDateTime } from "@/lib/date";

export type SessionItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  expiresAtUtc: string;
  isCurrent: boolean;
};

function parseBrowser(ua: string | null) {
  if (!ua) return "Unknown";
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("chrome/")) return "Chrome";
  if (s.includes("safari/") && !s.includes("chrome/")) return "Safari";
  if (s.includes("firefox/")) return "Firefox";
  return "Browser";
}

function parseOS(ua: string | null) {
  if (!ua) return "Unknown";
  const s = ua.toLowerCase();
  if (s.includes("windows")) return "Windows";
  if (s.includes("mac os") || s.includes("macintosh")) return "macOS";
  if (s.includes("android")) return "Android";
  if (s.includes("iphone") || s.includes("ipad")) return "iOS";
  if (s.includes("linux")) return "Linux";
  return "Unknown";
}

export function ActiveSessionsClient(props: { initial: SessionItem[] }) {
  const [fetchedSessions, setFetchedSessions] = useState<{ source: SessionItem[]; value: SessionItem[] } | null>(null);
  const sessions = fetchedSessions?.source === props.initial ? fetchedSessions.value : props.initial;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentId = sessions.find((s) => s.isCurrent)?.id ?? null;

  async function refresh() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/me/sessions", { cache: "no-store" });
    const data = (await res.json()) as { sessions?: SessionItem[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudieron cargar las sesiones.");
    setFetchedSessions({ source: props.initial, value: data.sessions ?? [] });
  }

  async function revoke(id: string) {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/me/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cerrar la sesión.");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Current Sessions</p>
        <Button variant="ghost" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No sessions found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    <Laptop className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {parseBrowser(s.userAgent)}
                        {s.isCurrent ? " (Current)" : ""}
                      </p>
                      {s.isCurrent ? (
                        <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-300">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{parseOS(s.userAgent)}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">IP: {s.ipAddress ?? "—"}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Last active: {formatUtcDateTime(s.updatedAtUtc)} • Expires: {formatUtcDateTime(s.expiresAtUtc)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={loading || s.isCurrent || s.id === currentId}
                  onClick={() => revoke(s.id)}
                  className={cn("text-zinc-500 hover:text-red-500", (s.isCurrent || s.id === currentId) ? "opacity-40" : "")}
                  aria-label="Cerrar sesión"
                  title={s.isCurrent ? "No puedes cerrar la sesión actual desde aquí." : "Cerrar sesión"}
                >
                  <Trash2 className="size-4" /> 
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
