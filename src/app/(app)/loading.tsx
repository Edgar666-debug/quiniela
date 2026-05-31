import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        <Skeleton className="h-40 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        <Skeleton className="h-40 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        <Skeleton className="h-40 rounded-xl border border-zinc-200 dark:border-zinc-800" />
      </div>
    </main>
  );
}
