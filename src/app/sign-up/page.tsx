"use client";

import { useState } from "react";
import { Mail, User, KeyRound, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-1px)] max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Regístrate con email y contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const { error } = await authClient.signUp.email({ name, email, password });
              setLoading(false);
              if (error) return setError(error.message ?? "No se pudo crear la cuenta");
              window.location.href = "/dashboard";
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                <Input
                  id="name"
                  className="pl-10"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                <Input
                  id="email"
                  className="pl-10"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
                <Input
                  id="password"
                  className="pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button disabled={loading} type="submit">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Crear cuenta
            </Button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>

          <Separator />

          <p className="text-sm text-zinc-600">
            ¿Ya tienes cuenta?{" "}
            <a className="underline underline-offset-4" href="/sign-in">
              Inicia sesión
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

