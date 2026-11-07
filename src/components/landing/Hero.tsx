import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardPreview } from "./DashboardPreview";

export function PitchBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 pitch-stripes" />
      {/* Círculo central e linha do meio-campo */}
      <div className="absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/10" />
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary/10" />
      {/* Brilho de refletor */}
      <div className="absolute -top-40 left-1/2 h-[28rem] w-[60rem] max-w-none -translate-x-1/2 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <PitchBackdrop className="-z-10" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-24 lg:pb-24">
        <div className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase backdrop-blur">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            Feito para quem vive o clube
          </p>
          <h1
            id="hero-title"
            className="font-heading text-5xl leading-[0.9] font-extrabold tracking-tight uppercase text-balance sm:text-6xl lg:text-7xl"
          >
            Seu clube do coração, <span className="text-primary">num painel só.</span>
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
            Próxima partida, classificação, artilheiro, líder de assistências e todas as competições
            do seu time, reunidos na mesma tela. Abriu, viu, ficou por dentro.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/cadastro" className={cn(buttonVariants({ size: "lg" }), "group")}>
              Criar conta
              <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-foreground/15 bg-card/80 backdrop-blur")}>
              Entrar
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Cadastro rápido: nome, e-mail, senha e o time do coração.
          </p>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
