import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-zinc-600">Sesión activa: {session.user.email}</p>
      <form
        action={async () => {
          "use server";
          await auth.api.signOut({ headers: await headers() });
          redirect("/");
        }}
      >
        <button className="w-fit rounded-md border px-4 py-2 text-sm font-medium" type="submit">
          Cerrar sesión
        </button>
      </form>
      <p className="text-sm text-zinc-600">
        Siguiente: aquí listaremos torneos, invitaciones, picks y ranking.
      </p>
    </main>
  );
}

