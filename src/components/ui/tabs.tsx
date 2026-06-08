"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

type TabsListProps = React.ComponentPropsWithRef<typeof TabsPrimitive.List>;
type TabsTriggerProps = React.ComponentPropsWithRef<typeof TabsPrimitive.Trigger>;
type TabsContentProps = React.ComponentPropsWithRef<typeof TabsPrimitive.Content>;

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

export function TabsContent({ className, ref, ...props }: TabsContentProps) {
  return <TabsPrimitive.Content ref={ref} className={cn("mt-2 focus-visible:outline-none", className)} {...props} />;
}
TabsContent.displayName = TabsPrimitive.Content.displayName;
