import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tus torneos y quinielas.",
};

export default async function SignInPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(resolveAuthRedirect(next));

  return <SignInForm next={next} />;
}
