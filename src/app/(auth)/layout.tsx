import Link from "next/link";
import { Trophy } from "lucide-react";

import { ThemeToggle } from "@/components/app/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed left-4 top-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Trophy className="size-4" />
          Quiniela
        </Link>
      </div>
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle collapsed align="right" />
      </div>
      {children}
    </>
  );
}
