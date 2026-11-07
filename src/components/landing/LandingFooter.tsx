import Link from "next/link";
import { Logo } from "./LandingHeader";

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">O painel do seu clube do coração.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground hover:underline">
            Entrar
          </Link>
          <Link href="/cadastro" className="text-muted-foreground hover:text-foreground hover:underline">
            Criar conta
          </Link>
        </nav>
      </div>
      <p className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        Os clubes, jogadores e números exibidos na prévia desta página são fictícios.
      </p>
    </footer>
  );
}
