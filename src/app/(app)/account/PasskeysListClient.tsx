"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { passkeyDateFormatter } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/app/inline-alert";

type PasskeyItem = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export function PasskeysListClient({ passkeys: initial }: { passkeys: PasskeyItem[] }) {
  const router = useRouter();
  const [passkeys, setPasskeys] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    const { error } = await authClient.passkey.deletePasskey({ id });

    if (error) {
      setError(error.message ?? "No se pudo eliminar la passkey.");
      setDeletingId(null);
      return;
    }

    setPasskeys((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
    router.refresh();
  }

  if (passkeys.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No hay passkeys registradas.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <InlineAlert variant="error" message={error} /> : null}
      <ul className="flex flex-col gap-2">
        {passkeys.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.name ?? "Passkey"}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Creada: {passkeyDateFormatter.format(p.createdAt)}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
              disabled={deletingId === p.id}
              onClick={() => handleDelete(p.id)}
              aria-label={`Eliminar passkey ${p.name ?? ""}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
