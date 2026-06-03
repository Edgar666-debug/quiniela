"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, User, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signUpWithEmail, type AuthActionState } from "./actions";

export function SignUpForm({ next }: { next?: string }) {
  const [formState, formAction, pending] = useActionState<AuthActionState, FormData>(signUpWithEmail, {});

  const error = formState.error;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-1px)] max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Regístrate con email y contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={formAction} className="flex flex-col gap-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 size-5 text-zinc-500" />
                <Input id="name" name="name" className="pl-10" placeholder="Tu nombre" autoComplete="name" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 size-5 text-zinc-500" />
                <Input id="email" name="email" className="pl-10" placeholder="tu@email.com" type="email" autoComplete="email" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 size-5 text-zinc-500" />
                <Input
                  id="password"
                  name="password"
                  className="pl-10"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <Button disabled={pending} type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear cuenta
            </Button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>

          <Separator />

          <p className="text-sm text-zinc-600">
            ¿Ya tienes cuenta?{" "}
            <Link className="underline underline-offset-4" href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}>
              Inicia sesión
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
