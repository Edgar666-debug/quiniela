"use client";

import { useState } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function CredentialsClient(props: { currentEmail: string }) {
  const [emailOverride, setEmailOverride] = useState<{ source: string; value: string } | null>(null);
  const email = emailOverride?.source === props.currentEmail ? emailOverride.value : props.currentEmail;
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Actual: {email}</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="newEmail">Nuevo email</Label>
          <Input
            id="newEmail"
            inputMode="email"
            autoComplete="email"
            placeholder="nuevo@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading || !newEmail.trim() || newEmail.trim() === email}
          onClick={async () => {
            setMessage(null);
            setError(null);
            setLoading(true);
            const { error } = await authClient.changeEmail({
              newEmail: newEmail.trim(),
              callbackURL: "/account",
            });
            setLoading(false);
            if (error) return setError(error.message ?? "No se pudo iniciar el cambio de email.");
            setMessage("Listo: revisa tu correo para confirmar el cambio (por ahora lo verás en consola del servidor).");
            setEmailOverride({ source: props.currentEmail, value: newEmail.trim() });
            setNewEmail("");
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Cambiar email
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Contraseña</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Cambia tu contraseña (requiere contraseña actual).</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Contraseña actual</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <Button
          type="button"
          disabled={loading || !currentPassword || !newPassword || newPassword.length < 8}
          onClick={async () => {
            setMessage(null);
            setError(null);
            setLoading(true);
            const res = await fetch("/api/auth/change-password", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ currentPassword, newPassword, revokeOtherSessions: true }),
            });
            setLoading(false);
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              return setError(data.error ?? "No se pudo cambiar la contraseña.");
            }
            setCurrentPassword("");
            setNewPassword("");
            setMessage("Contraseña actualizada. Se cerraron las otras sesiones.");
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Cambiar contraseña
        </Button>
        <p className="text-xs text-zinc-500">Mínimo 8 caracteres (ajustable en config de Better Auth).</p>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
