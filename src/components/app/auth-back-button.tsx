"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAuthBackTarget } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

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
