"use client";

import { useState } from "react";
import { Laptop, Loader2, RefreshCw, Trash2 } from "lucide-react";
import useSWR from "swr";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { Button } from "@/components/ui/button";
import { formatLocalDateTime } from "@/lib/date";
import { fetchJsonOrThrow, sendJsonRequest } from "@/lib/http";
import { cn } from "@/lib/utils";

export type SessionItem = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  expiresAtUtc: string;
  isCurrent: boolean;
};

function parseBrowser(userAgent: string | null) {
  if (!userAgent) return "Unknown";
  const normalized = userAgent.toLowerCase();
  if (normalized.includes("edg/")) return "Edge";
  if (normalized.includes("chrome/")) return "Chrome";
  if (normalized.includes("safari/") && !normalized.includes("chrome/")) return "Safari";
  if (normalized.includes("firefox/")) return "Firefox";
  return "Browser";
}

function parseOS(userAgent: string | null) {
  if (!userAgent) return "Unknown";
  const normalized = userAgent.toLowerCase();
  if (normalized.includes("windows")) return "Windows";
  if (normalized.includes("mac os") || normalized.includes("macintosh")) return "macOS";
  if (normalized.includes("android")) return "Android";
  if (normalized.includes("iphone") || normalized.includes("ipad")) return "iOS";
  if (normalized.includes("linux")) return "Linux";
  return "Unknown";
}

export function ActiveSessionsClient(props: { initial: SessionItem[] }) {
  const { data, isValidating, mutate } = useSWR(
    "/api/me/sessions",
    async (url: string) => {
      const payload = await fetchJsonOrThrow<{ sessions?: SessionItem[] }>(url, { cache: "no-store" }, "No se pudieron cargar las sesiones.");
      return payload.sessions ?? [];
    },
    {
      fallbackData: props.initial,
      revalidateOnFocus: false,
    },
  );
  const sessions = data ?? props.initial;
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentId = sessions.find((session) => session.isCurrent)?.id ?? null;

  async function refresh() {
    setError(null);

    try {
      await mutate();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "No se pudieron cargar las sesiones.");
    }
  }

  async function revoke(id: string) {
    setError(null);
    setRevokingId(id);

    const { response, data: responseData } = await sendJsonRequest<{ ok?: boolean; error?: string }>(`/api/me/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    setRevokingId(null);

    if (!response.ok) {
      setError(responseData.error ?? "No se pudo cerrar la sesión.");
      return;
    }

    await refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Current Sessions</p>
        <Button variant="ghost" size="sm" type="button" onClick={() => void refresh()} disabled={isValidating || Boolean(revokingId)}>
          {isValidating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-muted-ui text-sm">No sessions found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((session) => (
            <li key={session.id} className="list-card-ui">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="avatar-frame-ui size-10 text-zinc-700 dark:text-zinc-200">
                    <Laptop className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {parseBrowser(session.userAgent)}
                        {session.isCurrent ? " (Current)" : ""}
                      </p>
                      {session.isCurrent ? (
                        <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-300">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-ui text-xs">{parseOS(session.userAgent)}</p>
                    <p className="text-muted-ui text-xs">IP: {session.ipAddress ?? "—"}</p>
                    <p className="text-muted-ui text-xs">
                      Last active: {formatLocalDateTime(session.updatedAtUtc)} • Expires: {formatLocalDateTime(session.expiresAtUtc)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={isValidating || Boolean(revokingId) || session.isCurrent || session.id === currentId}
                  onClick={() => void revoke(session.id)}
                  className={cn("icon-muted-ui hover:text-red-500", session.isCurrent || session.id === currentId ? "opacity-40" : "")}
                  aria-label="Cerrar sesión"
                  title={session.isCurrent ? "No puedes cerrar la sesión actual desde aquí." : "Cerrar sesión"}
                >
                  {revokingId === session.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FeedbackAlerts error={error} />
    </div>
  );
}
