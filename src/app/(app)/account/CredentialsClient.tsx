"use client";

import { useReducer } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type CredentialsState = {
  emailOverride: { source: string; value: string } | null;
  newEmail: string;
  currentPassword: string;
  newPassword: string;
  loading: boolean;
  message: string | null;
  error: string | null;
};

type CredentialsAction =
  | { type: "SET_NEW_EMAIL"; value: string }
  | { type: "SET_CURRENT_PASSWORD"; value: string }
  | { type: "SET_NEW_PASSWORD"; value: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "EMAIL_CHANGE_OK"; source: string; value: string }
  | { type: "PASSWORD_CHANGE_OK" };

function credentialsReducer(state: CredentialsState, action: CredentialsAction): CredentialsState {
  switch (action.type) {
    case "SET_NEW_EMAIL":
      return { ...state, newEmail: action.value };
    case "SET_CURRENT_PASSWORD":
      return { ...state, currentPassword: action.value };
    case "SET_NEW_PASSWORD":
      return { ...state, newPassword: action.value };
    case "SUBMIT_START":
      return { ...state, loading: true, message: null, error: null };
    case "SUBMIT_ERROR":
      return { ...state, loading: false, error: action.error };
    case "EMAIL_CHANGE_OK":
      return {
        ...state,
        loading: false,
        message: `Te enviamos un enlace de confirmación a ${action.value}. Revisa tu correo para completar el cambio.`,
        emailOverride: { source: action.source, value: action.value },
        newEmail: "",
      };
    case "PASSWORD_CHANGE_OK":
      return {
        ...state,
        loading: false,
        message: "Contraseña actualizada. Se cerraron las otras sesiones.",
        currentPassword: "",
        newPassword: "",
      };
    default:
      return state;
  }
}

export function CredentialsClient(props: { currentEmail: string }) {
  const [state, dispatch] = useReducer(credentialsReducer, {
    emailOverride: null,
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    loading: false,
    message: null,
    error: null,
  });

  const email = state.emailOverride?.source === props.currentEmail ? state.emailOverride.value : props.currentEmail;

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
            value={state.newEmail}
            onChange={(e) => dispatch({ type: "SET_NEW_EMAIL", value: e.target.value })}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={state.loading || !state.newEmail.trim() || state.newEmail.trim() === email}
          onClick={async () => {
            dispatch({ type: "SUBMIT_START" });
            const { error } = await authClient.changeEmail({
              newEmail: state.newEmail.trim(),
              callbackURL: "/account",
            });
            if (error) return dispatch({ type: "SUBMIT_ERROR", error: error.message ?? "No se pudo iniciar el cambio de email." });
            dispatch({ type: "EMAIL_CHANGE_OK", source: props.currentEmail, value: state.newEmail.trim() });
          }}
        >
          {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
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
            value={state.currentPassword}
            onChange={(e) => dispatch({ type: "SET_CURRENT_PASSWORD", value: e.target.value })}
          />
        </div> 

        <div className="grid gap-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={state.newPassword}
            onChange={(e) => dispatch({ type: "SET_NEW_PASSWORD", value: e.target.value })}
          />
        </div>

        <Button
          type="button"
          disabled={state.loading || !state.currentPassword || !state.newPassword || state.newPassword.length < 8}
          onClick={async () => {
            dispatch({ type: "SUBMIT_START" });
            const res = await fetch("/api/auth/change-password", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                currentPassword: state.currentPassword,
                newPassword: state.newPassword,
                revokeOtherSessions: true,
              }),
            });
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              return dispatch({ type: "SUBMIT_ERROR", error: data.error ?? "No se pudo cambiar la contraseña." });
            }
            dispatch({ type: "PASSWORD_CHANGE_OK" });
          }}
        >
          {state.loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Cambiar contraseña
        </Button>
        <p className="text-xs text-zinc-500">Mínimo 8 caracteres (ajustable en config de Better Auth).</p>
      </div>

      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </div>
  );
}
