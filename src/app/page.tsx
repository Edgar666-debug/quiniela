import type { Metadata } from "next"; 
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Lock,
  Mail,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/app/theme-toggle";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Quiniela — Torneos de fútbol simples y rápidos",
  description: "Crea torneos tipo quiniela por invitación, cierra jornadas por horario y lleva el ranking en vivo.",
};

const features = [
  {
    icon: Users,
    title: "Torneos por invitación",
    description: "Crea un torneo privado y comparte el enlace. Solo entran quienes tú quieras, sin registros complicados.",
  },
  {
    icon: Lock,
    title: "Jornadas con cierre automático",
    description: "Define el horario de cierre y todos los picks se bloquean al instante. Sin trampa posible.",
  },
  {
    icon: BarChart3,
    title: "Ranking en vivo",
    description: "Los standings se actualizan en tiempo real con Supabase Realtime en cuanto cambian los puntos.",
  },
  {
    icon: Zap,
    title: "1X2 simple y directo",
    description: "Un punto por acierto. Sin handicaps, sin cuotas, sin complicaciones. Fútbol puro.",
  },
  {
    icon: Bell,
    title: "Notificaciones por email",
    description: "Recibe invitaciones, confirmaciones y recordatorios directo en tu bandeja de entrada.",
  },
  {
    icon: Mail,
    title: "Acceso sin contraseña",
    description: "Inicia sesión con un código OTP o con passkey. Sin recordar más contraseñas.",
  },
];

const steps = [
  { step: "01", title: "Crea tu torneo", description: "En un minuto configuras el nombre y el torneo queda listo." },
  { step: "02", title: "Invita a tus amigos", description: "Genera un enlace de invitación y compártelo por donde quieras." },
  { step: "03", title: "Agrega jornadas y partidos", description: "Define los partidos y el horario de cierre de cada jornada." },
  { step: "04", title: "Compite y sigue el ranking", description: "Cada participante hace sus picks y el ranking se actualiza solo." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <Trophy className="size-5 text-zinc-700 dark:text-zinc-300" />
            <span>Quiniela</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">
                Crear cuenta <ArrowRight className="size-4" />
              </Link>
            </Button>
            < ThemeToggle collapsed align="right" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Zap className="size-3" />
            Gratis · Sin publicidad · Por invitación
          </div>
          <h1 className="mt-4 text-balance text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Quinielas de fútbol{" "}
            <span className="text-zinc-500">simples y rápidas</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-zinc-600 dark:text-zinc-400">
            Crea torneos privados, cierra jornadas por horario y lleva el ranking en vivo. Sin complicaciones, solo fútbol.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Empieza gratis <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Ya tengo cuenta</Link>
            </Button>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitas</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">Sin configuración compleja. Listo para jugar en minutos.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <f.icon className="size-4 text-zinc-700 dark:text-zinc-300" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  {f.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* How it works */}
        <section className="bg-zinc-50 px-6 py-20 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">¿Cómo funciona?</h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">Cuatro pasos y estás jugando.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.step} className="flex flex-col gap-3">
                  <span className="text-4xl font-bold text-zinc-200 dark:text-zinc-700">{s.step}</span>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight">¿Listo para jugar?</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Crea tu cuenta gratis, arma tu torneo y reta a tus amigos hoy mismo.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Crear cuenta gratis <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
              {["Sin tarjeta de crédito", "Sin publicidad", "Cancela cuando quieras"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-zinc-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Trophy className="size-4" />
            <span>Quiniela</span>
          </div>
          <p>Hecho para jugar entre amigos.</p>
        </div>
      </footer>
    </div>
  );
}
