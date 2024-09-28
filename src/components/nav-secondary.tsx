"use client";

import Link from "next/link";

import { type LucideIcon } from "lucide-react";
import { UrlObject } from "url";

import { cn } from "@/lib/utils";

export function NavSecondary({
  className,
  items,
}: {
  items: {
    title: string;
    url: UrlObject | __next_route_internal_types__.RouteImpl<string>;
    icon: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
} & React.ComponentProps<"ul">) {
  if (!items?.length) {
    return null;
  }

  return (
    <ul className={cn("grid gap-0.5", className)}>
      {items.map((item) => (
        <li key={item.title}>
          <Link
            href={item.url}
            className="ring-ring hover:bg-accent hover:text-accent-foreground flex h-7 items-center gap-2.5 overflow-hidden rounded-md px-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2"
          >
            <item.icon className="text-muted-foreground h-4 w-4 shrink-0 translate-x-0.5" />
            <div className="text-muted-foreground line-clamp-1 grow overflow-hidden pr-6 font-medium">
              {item.title}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
