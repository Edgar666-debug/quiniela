"use client";

import { useActionState, useReducer } from "react";
import Link from "next/link";
import { KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInWithPassword, type AuthActionState } from "./actions";

type SignInMode = "password" | "otp" | "passkey";

type SignInState = {
  mode: SignInMode;
  email: string;
  password: string;
  otp: string;
  otpSent: boolean;
  name: string;
  error: string | null;
  loading: boolean;
};

type SignInAction =
  | { type: "SET_MODE"; mode: SignInMode }
  | { type: "SET_FIELD"; field: keyof SignInState; value: string | boolean }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "SUBMIT_DONE" }
  | { type: "OTP_SENT" };

const initialState: SignInState = {
  mode: "password",
  email: "",
  password: "",
  otp: "",
  otpSent: false,
  name: "",
  error: null,
  loading: false,
};

function signInReducer(state: SignInState, action: SignInAction): SignInState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode, error: null, otpSent: action.mode === "otp" ? state.otpSent : false, otp: action.mode === "otp" ? state.otp : "" };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SUBMIT_START":
      return { ...state, loading: true, error: null };
    case "SUBMIT_ERROR":
      return { ...state, loading: false, error: action.error };
    case "SUBMIT_DONE":
      return { ...state, loading: false };
    case "OTP_SENT":
      return { ...state, loading: false, otpSent: true };
    default:
      return state;
  }
}

export function SignInForm() {
  const [state, dispatch] = useReducer(signInReducer, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState<AuthActionState, FormData>(signInWithPassword, {});

  const title =
    state.mode === "otp" ? "Iniciar sesión con código" : state.mode === "passkey" ? "Iniciar sesión con passkey" : "Iniciar sesión";

  const passwordError = passwordState.error;

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
              variant={state.mode === "password" ? "secondary" : "outline"}
              onClick={() => dispatch({ type: "SET_MODE", mode: "password" })}
            >
              <LockKeyhole className="size-4" />
              Password
            </Button>
            <Button
              type="button"
              variant={state.mode === "otp" ? "secondary" : "outline"}
              onClick={() => dispatch({ type: "SET_MODE", mode: "otp" })}
            >
              <Mail className="size-4" />
              OTP
            </Button>
            <Button
              type="button"
              variant={state.mode === "passkey" ? "secondary" : "outline"}
              onClick={() => dispatch({ type: "SET_MODE", mode: "passkey" })}
            >
              <ShieldCheck className="size-4" />
              Passkey
            </Button>
          </div>

          {state.mode === "password" ? (
            <form action={passwordAction} className="flex flex-col gap-4">
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
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button disabled={passwordPending} type="submit">
                {passwordPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Entrar
              </Button>

              {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
            </form>
          ) : null}

          {state.mode === "otp" ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email-otp">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 size-5 text-zinc-500" />
                  <Input
                    id="email-otp"
                    className="pl-10"
                    placeholder="tu@email.com"
                    value={state.email}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "email", value: e.target.value })}
                    autoComplete="email"
                  />
                </div>
              </div>

              {!state.otpSent ? (
                <Button
                  disabled={state.loading || !state.email}
                  type="button"
                  onClick={async () => {
                    dispatch({ type: "SUBMIT_START" });
                    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: state.email, type: "sign-in" });
                    if (error) return dispatch({ type: "SUBMIT_ERROR", error: error.message ?? "No se pudo enviar el OTP" });
                    dispatch({ type: "OTP_SENT" });
                  }}
                >
                  {state.loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Enviar código
                </Button>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Código</Label>
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={state.otp}
                      onChange={(value) => dispatch({ type: "SET_FIELD", field: "otp", value })}
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
                      value={state.name}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })}
                      autoComplete="name"
                    />
                  </div>

                  <Button
                    disabled={state.loading || !state.otp}
                    type="button"
                    onClick={async () => {
                      dispatch({ type: "SUBMIT_START" });
                      const { error } = await authClient.signIn.emailOtp({
                        email: state.email,
                        otp: state.otp,
                        ...(state.name ? { name: state.name } : {}),
                      });
                      if (error) return dispatch({ type: "SUBMIT_ERROR", error: error.message ?? "No se pudo iniciar sesión con OTP" });
                      window.location.href = "/dashboard";
                    }}
                  >
                    {state.loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Entrar
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      dispatch({ type: "SET_FIELD", field: "otp", value: "" });
                      dispatch({ type: "SET_FIELD", field: "otpSent", value: false });
                    }}
                  >
                    Enviar otro código
                  </Button>
                </>
              )}

              {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
              <p className="text-xs text-zinc-500">
                En local/dev el OTP se imprime en la consola del servidor (pendiente integrar proveedor de email).
              </p>
            </div>
          ) : null}

          {state.mode === "passkey" ? (
            <div className="flex flex-col gap-3">
              <Button
                disabled={state.loading}
                type="button"
                onClick={async () => {
                  dispatch({ type: "SUBMIT_START" });
                  const { error } = await authClient.signIn.passkey({
                    autoFill: true,
                    fetchOptions: {
                      onSuccess() {
                        window.location.href = "/dashboard";
                      },
                    },
                  });
                  if (error) return dispatch({ type: "SUBMIT_ERROR", error: error.message ?? "No se pudo iniciar sesión con passkey" });
                  dispatch({ type: "SUBMIT_DONE" });
                }}
              >
                {state.loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Entrar con passkey
              </Button>
              {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
              <p className="text-xs text-zinc-500">
                Para registrar una passkey primero inicia sesión y luego agrega una desde el dashboard.
              </p>
            </div>
          ) : null}

          <Separator />

          <p className="text-sm text-zinc-600">
            ¿No tienes cuenta?{" "}
            <Link className="underline underline-offset-4" href="/sign-up">
              Crea una
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
