import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-heading text-lg leading-none font-extrabold tracking-wide uppercase sm:text-2xl min-[400px]:text-xl",
        className,
      )}
    >
      <span aria-hidden className="relative inline-block size-3 rounded-full bg-primary ring-4 ring-primary/20" />
      <span>
        Arqui<span className="text-primary">bancada</span>
      </span>
    </span>
  );
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" aria-label="Arquibancada, início" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>
        <nav aria-label="Conta" className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Entrar
          </Link>
          <Link href="/cadastro" className={buttonVariants({ size: "sm" })}>
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
