import { cva } from "class-variance-authority";

export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950 ring-offset-white dark:ring-offset-black",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-zinc-600 hover:text-zinc-900 data-[state=on]:bg-white data-[state=on]:text-zinc-900 data-[state=on]:shadow-sm dark:text-zinc-400 dark:hover:text-zinc-50 dark:data-[state=on]:bg-zinc-800 dark:data-[state=on]:text-zinc-50",
        outline:
          "border border-transparent bg-transparent hover:bg-zinc-100 data-[state=on]:border-zinc-200 data-[state=on]:bg-white dark:hover:bg-zinc-800 dark:data-[state=on]:border-zinc-800 dark:data-[state=on]:bg-zinc-800",
      },
      size: {
        default: "h-auto px-3 py-1.5",
        sm: "h-8 px-2 text-xs",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
