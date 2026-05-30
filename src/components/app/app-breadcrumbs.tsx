import { ChevronRight } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = { label: string; href?: string };

export function AppBreadcrumbs(props: { items: Crumb[] }) {
  if (props.items.length === 0) return null;
  const last = props.items[props.items.length - 1];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {props.items.map((item, idx) => {
          const isLast = idx === props.items.length - 1;
          return (
            <BreadcrumbItem key={`${item.label}-${idx}`}>
              {isLast || !item.href ? <BreadcrumbPage>{item.label}</BreadcrumbPage> : <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>}
              {isLast ? null : (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

