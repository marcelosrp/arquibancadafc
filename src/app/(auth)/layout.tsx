import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <div className="fixed top-3 right-3 z-50">
        <ThemeToggle />
      </div>
      <aside className="flex flex-col justify-center gap-3 bg-primary px-6 py-10 text-primary-foreground lg:px-16 lg:py-0">
        <p className="font-heading text-5xl leading-none font-extrabold tracking-wide uppercase sm:text-6xl lg:text-8xl">
          Arquibancada
        </p>
        <p className="max-w-md text-base opacity-90 lg:text-xl">
          Tudo do seu clube em um só lugar: competições, classificação, artilheiros e a próxima partida.
        </p>
      </aside>
      <div className="flex items-start justify-center px-4 py-8 lg:items-center lg:px-8">
        {children}
      </div>
    </div>
  );
}
