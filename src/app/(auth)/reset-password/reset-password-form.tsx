"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      token,
      newPassword: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "No se pudo restablecer la contraseña. El enlace puede haber expirado.");
      return;
    }

    router.push("/dashboard");
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-1px)] max-w-md items-center px-6 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Enlace inválido</CardTitle>
            <CardDescription>
              Este enlace de restablecimiento no es válido o ha expirado. Solicita uno nuevo desde la página de inicio de sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => router.push("/forgot-password")}>
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-1px)] max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>Elige una contraseña segura de al menos 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 size-5 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 size-5 text-zinc-500" />
                <Input
                  id="confirm"
                  type="password"
                  className="pl-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            <Button disabled={loading} type="submit">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Restablecer contraseña
            </Button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
