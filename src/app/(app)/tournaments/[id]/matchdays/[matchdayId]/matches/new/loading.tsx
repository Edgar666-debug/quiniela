import { Skeleton } from "@/components/ui/skeleton";

export default function MatchNewLoading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-64 rounded-xl border border-zinc-200 dark:border-zinc-800" />
      <Skeleton className="h-64 rounded-xl border border-zinc-200 dark:border-zinc-800" />
    </main>
  );
}

