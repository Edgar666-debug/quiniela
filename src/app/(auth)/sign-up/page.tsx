import type { Metadata } from "next";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate para crear o unirte a torneos.",
};

export default async function SignUpPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams;
  return <SignUpForm next={next} />;
}
