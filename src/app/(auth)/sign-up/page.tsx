import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate para crear o unirte a torneos.",
};

export default async function SignUpPage(props: { searchParams: Promise<{ next?: string }> }) {
  const [params, session] = await Promise.all([
    props.searchParams,
    headers().then((requestHeaders) => auth.api.getSession({ headers: requestHeaders })),
  ]);
  const { next } = params;
  if (session) redirect(resolveAuthRedirect(next));

  return <SignUpForm next={next} />;
}
