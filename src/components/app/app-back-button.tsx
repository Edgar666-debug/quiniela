"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildAppCrumbs, getBackTarget } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

type AppBackButtonProps = {
  tournamentName?: string | null;
  tournamentId?: string | null;
  className?: string;
  compact?: boolean;
};

export function AppBackButton(props: AppBackButtonProps) {
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
