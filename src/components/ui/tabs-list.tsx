"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

type TabsListProps = React.ComponentPropsWithRef<typeof TabsPrimitive.List>;

export function TabsList({ className, ref, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-auto w-full items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}

TabsList.displayName = TabsPrimitive.List.displayName;
