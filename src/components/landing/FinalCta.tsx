import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-xl sm:px-12 lg:py-20 dark:bg-card dark:text-card-foreground dark:ring-1 dark:ring-primary/30">
        {/* Gramado e meio-campo */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.06)_0_56px,transparent_56px_112px)] dark:bg-[repeating-linear-gradient(90deg,color-mix(in_oklch,var(--primary)_6%,transparent)_0_56px,transparent_56px_112px)]" />
          <div className="absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/15 dark:border-primary/15" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/15 dark:bg-primary/15" />
          <div className="absolute -bottom-32 left-1/2 hidden h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl dark:block" />
        </div>
        <h2
          id="cta-title"
          className="mx-auto max-w-3xl font-heading text-4xl leading-none font-extrabold tracking-tight uppercase text-balance sm:text-6xl"
        >
          Seu time entra em campo. <span className="dark:text-primary">Você chega sabendo de tudo.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty opacity-90 sm:text-lg">
          Monte o seu painel agora e acompanhe o clube do coração sem perder nenhum detalhe.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group bg-primary-foreground text-primary hover:bg-primary-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90",
            )}
          >
            Criar minha conta
            <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:border-input dark:text-foreground dark:hover:bg-input/50",
            )}
          >
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
