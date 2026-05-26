"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const { error } = await authClient.signIn.email({ email, password });
          setLoading(false);
          if (error) return setError(error.message);
          window.location.href = "/dashboard";
        }}
      >
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />
        <button
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
      <p className="text-sm text-zinc-600">
        ¿No tienes cuenta? <a className="underline" href="/sign-up">Crea una</a>.
      </p>
    </main>
  );
}

