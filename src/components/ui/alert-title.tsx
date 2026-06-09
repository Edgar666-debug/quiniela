import * as React from "react";

import { cn } from "@/lib/utils";

type AlertTitleProps = React.ComponentPropsWithRef<"h5">;

export function AlertTitle({ children, className, ref, ...props }: AlertTitleProps) {
  return (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
      {children ?? <span className="sr-only">Alert title</span>}
    </h5>
  );
}

AlertTitle.displayName = "AlertTitle";
