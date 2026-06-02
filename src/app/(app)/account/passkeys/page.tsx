import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { PasskeysClient } from "./passkeys-client";

export const metadata: Metadata = {
  title: "Passkeys",
};

export default function PasskeysPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <KeyRound className="h-4 w-4" />
          <span className="text-sm">Seguridad</span>
        </div>
        <h1 className="text-2xl font-semibold">Passkeys</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Registra una passkey para iniciar sesión sin contraseña.
        </p>
      </div>

      <PasskeysClient />
    </main>
  );
}
