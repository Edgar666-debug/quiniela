import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";

import { cn } from "@/lib/utils";

type InputOTPProps = React.ComponentPropsWithRef<typeof OTPInput>;

export function InputOTP({ className, containerClassName, ref, ...props }: InputOTPProps) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}
InputOTP.displayName = "InputOTP";

export function InputOTPGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

export function InputOTPSlot({ index, className, ...props }: { index: number } & React.HTMLAttributes<HTMLDivElement>) {
  const inputOTPContext = React.use(OTPInputContext);
  const slot = inputOTPContext?.slots?.[index];

  return (
    <div
      className={cn(
        "relative flex size-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-950",
        slot?.isActive ? "ring-2 ring-zinc-950 ring-offset-2 ring-offset-white dark:ring-zinc-50 dark:ring-offset-black" : "",
        className,
      )}
      {...props}
    >
      {slot?.char ?? ""}
      {slot?.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-pulse bg-zinc-950 dark:bg-zinc-50" />
        </div>
      ) : null}
    </div>
  );
}
