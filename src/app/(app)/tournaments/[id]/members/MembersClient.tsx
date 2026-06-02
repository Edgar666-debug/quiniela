"use client";

import { useMemo, useState } from "react";
import { Loader2, LogOut, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/app/inline-alert";

type MemberRow = {
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  user: { id: string; email: string; name: string | null };
};

export function MembersClient(props: { tournamentId: string; myUserId: string; myRole: "OWNER" | "ORGANIZER" | "PLAYER"; initial: MemberRow[] }) {
  const [localRows, setLocalRows] = useState<{ source: MemberRow[]; value: MemberRow[] } | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = localRows?.source === props.initial ? localRows.value : props.initial;

  const canManage = useMemo(() => props.myRole === "OWNER" || props.myRole === "ORGANIZER", [props.myRole]);

  function canRemove(target: MemberRow) {
    if (!canManage) return false;
    if (target.user.id === props.myUserId) return false;
    if (target.role === "OWNER") return false;
    if (props.myRole === "ORGANIZER" && target.role !== "PLAYER") return false;
    return true;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <InlineAlert variant="error" message={error} /> : null}

      <div className="flex flex-wrap gap-2">
        {props.myRole !== "OWNER" ? (
          <Button
            variant="outline"
            type="button"
            disabled={Boolean(loadingUserId)}
            onClick={async () => {
              setError(null);
              setLoadingUserId(props.myUserId);
              const res = await fetch(`/api/tournaments/${props.tournamentId}/leave`, { method: "POST" });
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              setLoadingUserId(null);
              if (!res.ok) return setError(data.error ?? "No se pudo salir del torneo");
              window.location.href = "/tournaments";
            }}
          >
            {loadingUserId === props.myUserId ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Salir del torneo
          </Button>
        ) : null}
      </div>

      {rows.map((m) => (
        <div key={m.user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{m.user.name ?? m.user.email}</p>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{m.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">{m.role}</span>
            {canRemove(m) ? (
              <Button
                size="sm"
                variant="outline"
                disabled={loadingUserId === m.user.id}
                onClick={async () => {
                  setError(null);
                  setLoadingUserId(m.user.id);
                  const res = await fetch(`/api/tournaments/${props.tournamentId}/members/${m.user.id}`, { method: "DELETE" });
                  const data = (await res.json().catch(() => ({}))) as { error?: string };
                  setLoadingUserId(null);
                  if (!res.ok) return setError(data.error ?? "No se pudo expulsar");
                  setLocalRows({
                    source: props.initial,
                    value: rows.filter((x) => x.user.id !== m.user.id),
                  });
                }}
              >
                {loadingUserId === m.user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Expulsar
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
