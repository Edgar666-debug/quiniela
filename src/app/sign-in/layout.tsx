import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta para gestionar torneos, picks y ranking.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
