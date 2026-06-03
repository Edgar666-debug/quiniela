"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";

export type AuthActionState = { error?: string };

export async function signInWithPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const existing = await auth.api.getSession({ headers: await headers() });
  if (existing) redirect("/dashboard");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message ?? "No se pudo iniciar sesión" };
    }
    return { error: "No se pudo iniciar sesión" };
  }

  // Only allow internal paths as redirect targets
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(destination);
}
