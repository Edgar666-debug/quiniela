"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Mail, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { pushAndRefresh } from "@/lib/navigation";
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
    await authClient.signOut();
    setLoading(false);
    pushAndRefresh(router, "/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          className={cn(
            props.collapsed ? "size-10 justify-center px-0" : "w-full justify-start gap-3 px-2",
            "rounded-xl",
          )}
          aria-label="Menú de usuario"
        >
          <div className="avatar-frame-ui size-8 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {(props.user.name ?? props.user.email).slice(0, 1).toUpperCase()}
          </div>
          {props.collapsed ? null : (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="text-muted-ui truncate text-xs">{props.user.email}</p>
              </div>
              <ChevronUp className="icon-muted-ui size-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel>
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{displayName}</p>
            <p className="text-muted-ui truncate text-xs">{props.user.email}</p>
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
            <Settings className="size-4" />
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
            <Mail className="size-4" />
            Invitaciones
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => signOut()} className="text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500">
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
