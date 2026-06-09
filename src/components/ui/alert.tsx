import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-lg border px-3 py-2 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3 [&>svg]:text-current [&>svg~*]:pl-7", {
  variants: {
    variant: {
      default: "surface-soft-ui text-zinc-800 dark:text-zinc-200",
      info: "surface-soft-ui text-zinc-800 dark:text-zinc-200",
      success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950/50 dark:bg-emerald-950/30 dark:text-emerald-200",
      destructive: "border-red-200 bg-red-50 text-red-800 dark:border-red-950/50 dark:bg-red-950/30 dark:text-red-200",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type AlertProps = React.ComponentPropsWithRef<"div"> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ref, ...props }: AlertProps) {
  return <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}
Alert.displayName = "Alert";

type AlertTitleProps = React.ComponentPropsWithRef<"h5">;

export function AlertTitle({ className, ref, ...props }: AlertTitleProps) {
  return <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}
AlertTitle.displayName = "AlertTitle";

type AlertDescriptionProps = React.ComponentPropsWithRef<"div">;

export function AlertDescription({ className, ref, ...props }: AlertDescriptionProps) {
  return <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}
AlertDescription.displayName = "AlertDescription";
