"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { passkeyDateFormatter } from "@/lib/format";
import { EmptyState } from "@/components/app/empty-state";
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
    return <EmptyState compact description="No hay passkeys registradas." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <InlineAlert variant="error" message={error} /> : null}
      <ul className="flex flex-col gap-2">
        {passkeys.map((p) => (
          <li
            key={p.id}
            className="list-row-ui flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.name ?? "Passkey"}</p>
              <p className="text-subtle-ui text-xs">
                Creada: {passkeyDateFormatter.format(p.createdAt)}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="icon-muted-ui shrink-0 hover:text-red-500 dark:hover:text-red-400"
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
