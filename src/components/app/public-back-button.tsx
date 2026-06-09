"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
