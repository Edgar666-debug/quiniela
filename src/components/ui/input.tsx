import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.ComponentPropsWithRef<"input">;

export function Input({ className, type, ref, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-black dark:ring-offset-black dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}
Input.displayName = "Input";
