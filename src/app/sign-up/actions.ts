"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";

export type AuthActionState = { error?: string };

export async function signUpWithEmail(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const existing = await auth.api.getSession({ headers: await headers() });
  if (existing) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!name || !email || !password) {
    return { error: "Nombre, email y contraseña son obligatorios." };
  }

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: error.message ?? "No se pudo crear la cuenta" };
    }
    return { error: "No se pudo crear la cuenta" };
  }

  // Only allow internal paths as redirect targets
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  redirect(destination);
}
