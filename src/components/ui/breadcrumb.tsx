import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" {...props} />;
}

export function BreadcrumbList(props: React.ComponentProps<"ol">) {
  return <ol {...props} className={cn("text-muted-ui flex flex-wrap items-center gap-1.5 text-sm", props.className)} />;
}

export function BreadcrumbItem(props: React.ComponentProps<"li">) {
  return <li {...props} className={cn("inline-flex items-center gap-1.5", props.className)} />;
}

export function BreadcrumbLink(props: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={props.href} className={cn("hover:text-zinc-900 dark:hover:text-zinc-50", props.className)}>
      {props.children}
    </Link>
  );
}

export function BreadcrumbPage(props: React.ComponentProps<"span">) {
  return <span {...props} aria-current="page" className={cn("font-medium text-zinc-900 dark:text-zinc-50", props.className)} />;
}

export function BreadcrumbSeparator(props: React.ComponentProps<"span">) {
  return <span {...props} role="presentation" className={cn("select-none text-zinc-400 dark:text-zinc-600", props.className)} />;
}
