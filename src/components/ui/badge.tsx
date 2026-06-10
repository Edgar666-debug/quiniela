import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:focus:ring-zinc-50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900",
        secondary: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
        outline: "border-subtle-ui text-muted-ui",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950/50 dark:bg-emerald-950/30 dark:text-emerald-200",
        destructive: "border-red-200 bg-red-50 text-red-800 dark:border-red-950/50 dark:bg-red-950/30 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

type BadgeProps = React.ComponentPropsWithRef<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ref, ...props }: BadgeProps) {
  return <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
}
Badge.displayName = "Badge";
