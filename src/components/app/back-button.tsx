"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buildAppCrumbs, getAuthBackTarget, getBackTarget } from "@/lib/app-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  tournamentName?: string | null;
  tournamentId?: string | null;
  className?: string;
  compact?: boolean;
};

export function AppBackButton(props: BackButtonProps) {
  const pathname = usePathname();
  const crumbs = buildAppCrumbs(pathname, props.tournamentName ?? null, props.tournamentId ?? null);
  const back = getBackTarget(crumbs);

  if (!back) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size={props.compact ? "icon" : "sm"}
      className={cn(props.compact ? "shrink-0" : "gap-1.5", props.className)}
    >
      <Link href={back.href} aria-label={props.compact ? `Volver a ${back.label}` : undefined}>
        <ArrowLeft className="size-4 shrink-0" />
        {props.compact ? null : <span className="truncate">{back.label}</span>}
      </Link>
    </Button>
  );
}

export function AuthBackButton(props: { className?: string }) {
  const pathname = usePathname();
  const back = getAuthBackTarget(pathname);

  return (
    <Button asChild variant="ghost" size="sm" className={cn("gap-1.5", props.className)}>
      <Link href={back.href}>
        <ArrowLeft className="size-4" />
        {back.label}
      </Link>
    </Button>
  );
}

export function PublicBackButton(props: { className?: string }) {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Button asChild variant="ghost" size="sm" className={cn("gap-1.5", props.className)}>
      <Link href="/">
        <ArrowLeft className="size-4" />
        Inicio
      </Link>
    </Button>
  );
}
