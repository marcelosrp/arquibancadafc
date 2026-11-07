import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavItems } from "./NavItems";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col md:pl-60">
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:inset-y-0 md:right-auto md:w-60 md:flex-col md:border-t-0 md:border-r md:p-4"
      >
        <p className="hidden px-3 pb-6 font-heading text-3xl leading-none font-extrabold tracking-wide text-sidebar-primary uppercase md:block">
          Arquibancada
        </p>
        <Suspense fallback={<ul className="flex-1" />}>
          <NavItems />
        </Suspense>
        <div className="flex items-center justify-center gap-1 px-2 md:justify-between md:px-0 md:pt-4">
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="md:border md:border-sidebar-border">
              <LogOut aria-hidden />
              Sair
            </Button>
          </form>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pt-6 pb-28 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
