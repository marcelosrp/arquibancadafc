"use client";

import { LayoutDashboard, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
  {
    href: "/dashboard#competicoes",
    label: "Competições",
    Icon: Trophy,
    match: (p: string) => p.startsWith("/competicoes/"),
  },
  { href: "/perfil", label: "Perfil", Icon: User, match: (p: string) => p === "/perfil" },
];

export function NavItems() {
  const pathname = usePathname();
  return (
    <ul className="flex flex-1 items-stretch justify-around md:flex-col md:justify-start md:gap-1">
      {ITEMS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <li key={href} className="flex-1 md:flex-none">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors md:flex-row md:justify-start md:gap-3 md:px-3 md:text-sm",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
