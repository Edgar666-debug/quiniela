import type { Metadata } from "next";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tus torneos y quinielas.",
};

export default async function SignInPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return <SignInForm next={next} />;
}
