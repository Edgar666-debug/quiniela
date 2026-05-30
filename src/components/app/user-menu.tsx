"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Mail, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu(props: { user: { email: string; name: string | null }; collapsed: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const displayName = props.user.name ?? props.user.email.split("@")[0] ?? "Cuenta";

  async function signOut() {
    setLoading(true);
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          className={cn(
            props.collapsed ? "h-10 w-10 justify-center px-0" : "w-full justify-start gap-3 px-2",
            "rounded-xl",
          )}
          aria-label="Menú de usuario"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
            {(props.user.name ?? props.user.email).slice(0, 1).toUpperCase()}
          </div>
          {props.collapsed ? null : (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{props.user.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel>
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{displayName}</p>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{props.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/account"
            className="flex items-center gap-2"
            onClick={() => {
              props.onNavigate?.();
            }}
          >
            <Settings className="h-4 w-4" />
            Cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/tournaments/join"
            className="flex items-center gap-2"
            onClick={() => {
              props.onNavigate?.();
            }}
          >
            <Mail className="h-4 w-4" />
            Invitaciones
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => signOut()} className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
