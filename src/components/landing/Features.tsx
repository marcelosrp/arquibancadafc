import { CalendarClock, Footprints, Goal, ListOrdered, MoonStar, Trophy } from "lucide-react";

const FEATURES = [
  {
    Icon: CalendarClock,
    title: "Próxima partida",
    text: "Adversário, competição, dia e horário do próximo jogo logo no topo. Nada de perder a hora do apito.",
  },
  {
    Icon: ListOrdered,
    title: "Classificação",
    text: "Veja onde o seu time está na tabela e quem vem logo atrás, em cada campeonato que ele disputa.",
  },
  {
    Icon: Goal,
    title: "Artilheiro",
    text: "Quem está balançando as redes na competição e quantos gols já marcou.",
  },
  {
    Icon: Footprints,
    title: "Líder de assistências",
    text: "O garçom do campeonato também tem vez: quem mais deixou os companheiros na cara do gol.",
  },
  {
    Icon: Trophy,
    title: "Todas as competições",
    text: "Estadual, copa, liga: cada competição do seu clube na temporada, com detalhes a um toque.",
  },
  {
    Icon: MoonStar,
    title: "Do seu jeito",
    text: "No celular ou no computador, com tema claro ou escuro para acompanhar de dia ou de madrugada.",
  },
];

export function Features() {
  return (
    <section aria-labelledby="features-title" className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-6 lg:pt-8 lg:pb-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <p className="font-heading text-sm font-semibold tracking-widest text-primary uppercase">
          Por que Arquibancada
        </p>
        <h2
          id="features-title"
          className="font-heading text-4xl leading-none font-extrabold tracking-tight uppercase text-balance sm:text-5xl"
        >
          Tudo do seu time, sem abrir dez abas
        </h2>
        <p className="text-pretty text-muted-foreground sm:text-lg">
          Pare de caçar resultado e tabela em vários lugares. O que importa para o torcedor fica
          organizado num painel feito para o seu clube.
        </p>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <li
            key={title}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
          >
            <span
              aria-hidden
              className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20"
            >
              <Icon className="size-5" />
            </span>
            <h3 className="font-heading text-2xl leading-none font-bold tracking-wide uppercase">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
