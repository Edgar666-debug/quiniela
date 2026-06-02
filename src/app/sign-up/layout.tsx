import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate para crear torneos, unirte por invitación y seguir el ranking.",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
