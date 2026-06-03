import type { Metadata } from "next";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate para crear o unirte a torneos.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
