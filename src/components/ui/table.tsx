import * as React from "react";

import { cn } from "@/lib/utils";

type TableProps = React.ComponentPropsWithRef<"table">;
type TableHeaderProps = React.ComponentPropsWithRef<"thead">;
type TableBodyProps = React.ComponentPropsWithRef<"tbody">;
type TableFooterProps = React.ComponentPropsWithRef<"tfoot">;
type TableRowProps = React.ComponentPropsWithRef<"tr">;
type TableHeadProps = React.ComponentPropsWithRef<"th">;
type TableCellProps = React.ComponentPropsWithRef<"td">;
type TableCaptionProps = React.ComponentPropsWithRef<"caption">;

function Table({ className, ref, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}
Table.displayName = "Table";

function TableHeader({ className, ref, ...props }: TableHeaderProps) {
  return <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />;
}
TableHeader.displayName = "TableHeader";

function TableBody({ className, ref, ...props }: TableBodyProps) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}
TableBody.displayName = "TableBody";

function TableFooter({ className, ref, ...props }: TableFooterProps) {
  return (
    <tfoot ref={ref} className={cn("border-t bg-zinc-50 font-medium dark:bg-zinc-950/30 [&>tr]:last:border-b-0", className)} {...props} />
  );
}
TableFooter.displayName = "TableFooter";

function TableRow({ className, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b border-zinc-200 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:bg-zinc-950/30 data-[state=selected]:bg-zinc-50 dark:data-[state=selected]:bg-zinc-950",
        className,
      )}
      {...props}
    />
  );
}
TableRow.displayName = "TableRow";

function TableHead({ className, ref, ...props }: TableHeadProps) {
  return (
    <th
      ref={ref}
      className={cn("text-muted-ui h-10 px-3 text-left align-middle text-xs font-medium [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}
TableHead.displayName = "TableHead";

function TableCell({ className, ref, ...props }: TableCellProps) {
  return <td ref={ref} className={cn("p-3 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />;
}
TableCell.displayName = "TableCell";

function TableCaption({ className, ref, ...props }: TableCaptionProps) {
  return <caption ref={ref} className={cn("text-muted-ui mt-4 text-sm", className)} {...props} />;
}
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
