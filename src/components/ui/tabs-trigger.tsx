"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

type TabsTriggerProps = React.ComponentPropsWithRef<typeof TabsPrimitive.Trigger>;

export function TabsTrigger({ className, ref, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50",
        className,
      )}
      {...props}
    />
  );
}

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
