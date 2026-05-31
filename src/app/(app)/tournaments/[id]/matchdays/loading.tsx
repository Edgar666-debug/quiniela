import { Skeleton } from "@/components/ui/skeleton";

export default function MatchdaysLoading() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-56 rounded-xl border border-zinc-200 dark:border-zinc-800" />
    </main>
  );
}

