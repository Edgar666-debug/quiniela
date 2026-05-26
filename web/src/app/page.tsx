export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Quiniela</h1>
      <p className="text-sm text-zinc-600">
        Torneos por invitación, jornadas cerradas por horario, 1 punto por acierto (1X2), ranking en vivo.
      </p>
      <div className="flex gap-3">
        <a className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white" href="/sign-in">
          Iniciar sesión
        </a>
        <a className="rounded-md border px-4 py-2 text-sm font-medium" href="/sign-up">
          Crear cuenta
        </a>
        <a className="rounded-md border px-4 py-2 text-sm font-medium" href="/dashboard">
          Dashboard
        </a>
      </div>
    </main>
  );
}
