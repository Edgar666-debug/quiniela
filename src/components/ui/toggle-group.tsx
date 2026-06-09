"use client";

import { createContext, use, useMemo, type ComponentPropsWithRef } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle-variants";

const ToggleGroupVariantContext = createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

type ToggleGroupProps = ComponentPropsWithRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>;

export function ToggleGroup({ className, variant, size, children, ref, ...props }: ToggleGroupProps) {
  const contextValue = useMemo(() => ({ variant, size }), [size, variant]);
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(
        "flex w-full gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
      {...props}
    >
      <ToggleGroupVariantContext.Provider value={contextValue}>{children}</ToggleGroupVariantContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

type ToggleGroupItemProps = ComponentPropsWithRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>;

export function ToggleGroupItem({ className, children, variant, size, ref, ...props }: ToggleGroupItemProps) {
  const context = use(ToggleGroupVariantContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant ?? variant,
          size: context.size ?? size,
        }),
        "flex-1",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
