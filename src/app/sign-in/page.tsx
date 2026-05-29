"use client";

import { useMemo, useState } from "react";
import { KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  const [mode, setMode] = useState<"password" | "otp" | "passkey">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (mode === "otp") return "Iniciar sesión con código";
    if (mode === "passkey") return "Iniciar sesión con passkey";
    return "Iniciar sesión";
  }, [mode]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-1px)] max-w-md items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Accede a tu cuenta para gestionar torneos, picks y ranking.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={mode === "password" ? "secondary" : "outline"}
              onClick={() => {
                setError(null);
                setMode("password");
              }}
            >
              <LockKeyhole className="h-4 w-4" />
              Password
            </Button>
            <Button
              type="button"
              variant={mode === "otp" ? "secondary" : "outline"}
              onClick={() => {
                setError(null);
                setOtpSent(false);
                setOtp("");
                setMode("otp");
              }}
            >
              <Mail className="h-4 w-4" />
              OTP
            </Button>
            <Button
              type="button"
              variant={mode === "passkey" ? "secondary" : "outline"}
              onClick={() => {
                setError(null);
                setMode("passkey");
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              Passkey
            </Button>
          </div>

          {mode !== "passkey" ? (
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
          ) : null}

          {mode === "password" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                const { error } = await authClient.signIn.email({ email, password });
                setLoading(false);
                if (error) return setError(error.message ?? "No se pudo iniciar sesión");
                window.location.href = "/dashboard";
              }}
            >
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
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button disabled={loading || !email || !password} type="submit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Entrar
              </Button>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>
          ) : null}

          {mode === "otp" ? (
            <div className="flex flex-col gap-4">
              {!otpSent ? (
                <Button
                  disabled={loading || !email}
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
                    setLoading(false);
                    if (error) return setError(error.message ?? "No se pudo enviar el OTP");
                    setOtpSent(true);
                  }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Enviar código
                </Button>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Código</Label>
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre (si es tu primera vez)</Label>
                    <Input
                      id="name"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <Button
                    disabled={loading || !otp}
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setLoading(true);
                      const { error } = await authClient.signIn.emailOtp({
                        email,
                        otp,
                        ...(name ? { name } : {}),
                      });
                      setLoading(false);
                      if (error) return setError(error.message ?? "No se pudo iniciar sesión con OTP");
                      window.location.href = "/dashboard";
                    }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Entrar
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                    }}
                  >
                    Enviar otro código
                  </Button>
                </>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <p className="text-xs text-zinc-500">
                En local/dev el OTP se imprime en la consola del servidor (pendiente integrar proveedor de email).
              </p>
            </div>
          ) : null}

          {mode === "passkey" ? (
            <div className="flex flex-col gap-3">
              <Button
                disabled={loading}
                type="button"
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  const { error } = await authClient.signIn.passkey({
                    autoFill: true,
                    fetchOptions: {
                      onSuccess() {
                        window.location.href = "/dashboard";
                      },
                    },
                  });
                  setLoading(false);
                  if (error) return setError(error.message ?? "No se pudo iniciar sesión con passkey");
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Entrar con passkey
              </Button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <p className="text-xs text-zinc-500">
                Para registrar una passkey primero inicia sesión y luego agrega una desde el dashboard.
              </p>
            </div>
          ) : null}

          <Separator />

          <p className="text-sm text-zinc-600">
            ¿No tienes cuenta?{" "}
            <a className="underline underline-offset-4" href="/sign-up">
              Crea una
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
