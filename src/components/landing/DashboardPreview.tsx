import { TeamLogo } from "@/components/shared/TeamLogo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Dados fictícios: nenhum clube real, nenhuma chamada à API.
const MY_CLUB = "Aurora FC";

const STANDINGS = [
  { rank: 1, team: "Aurora FC", points: 31 },
  { rank: 2, team: "União Litoral", points: 29 },
  { rank: 3, team: "Atlético Serrano", points: 26 },
  { rank: 4, team: "Vale Verde EC", points: 24 },
];

const COMPETITIONS = ["Estadual", "Copa Nacional", "Liga Nacional"];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <figure className={cn("relative mx-auto w-full max-w-md lg:max-w-none", className)}>
      {/* Halo atrás da “tela” */}
      <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-primary/10 ring-1 ring-foreground/5">
        {/* Barra da janela */}
        <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="ml-1 truncate text-xs text-muted-foreground">Seu painel</span>
          <Badge className="ml-auto uppercase tracking-wider">Exemplo</Badge>
        </div>

        <div className="flex flex-col gap-3 p-3 sm:p-4">
          {/* Clube */}
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <TeamLogo name={MY_CLUB} src={null} size={44} className="bg-primary text-primary-foreground" />
            <div className="min-w-0">
              <p className="truncate font-heading text-2xl leading-none font-bold tracking-wide uppercase">
                {MY_CLUB}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Seu clube do coração</p>
            </div>
          </div>

          {/* Próxima partida */}
          <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card p-3 sm:p-4">
            <div aria-hidden className="absolute inset-0 pitch-stripes opacity-60" />
            <div className="relative flex flex-col gap-2">
              <p className="font-heading text-xs font-semibold tracking-widest text-primary uppercase">
                Próxima partida
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <TeamLogo name={MY_CLUB} src={null} size={32} />
                  <span className="truncate font-heading text-xl font-bold uppercase">Aurora</span>
                </div>
                <span className="shrink-0 font-heading text-lg font-bold text-muted-foreground">x</span>
                <div className="flex min-w-0 items-center justify-end gap-2">
                  <span className="truncate font-heading text-xl font-bold uppercase">Litoral</span>
                  <TeamLogo name="União Litoral" src={null} size={32} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Estadual · domingo, 16h</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
            {/* Classificação */}
            <div className="rounded-xl border bg-card p-3">
              <Label>Classificação</Label>
              <ol className="mt-2 flex flex-col gap-1 text-sm tabular-nums">
                {STANDINGS.map((row) => (
                  <li
                    key={row.team}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-1.5 py-1",
                      row.team === MY_CLUB && "bg-primary/10 font-semibold text-foreground",
                    )}
                  >
                    <span className="w-4 text-right text-muted-foreground">{row.rank}</span>
                    <span className="min-w-0 flex-1 truncate">{row.team}</span>
                    <span>{row.points}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Destaques */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-xl border bg-card p-3">
                <Label>Artilheiro</Label>
                <p className="mt-1 truncate text-sm font-medium">R. Matos</p>
                <p className="font-heading text-3xl leading-none font-extrabold text-primary tabular-nums">
                  9 <span className="text-sm font-semibold text-muted-foreground">gols</span>
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <Label>Assistências</Label>
                <p className="mt-1 truncate text-sm font-medium">D. Lima</p>
                <p className="font-heading text-3xl leading-none font-extrabold text-primary tabular-nums">
                  6 <span className="text-sm font-semibold text-muted-foreground">passes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Competições */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Label>Competições</Label>
            {COMPETITIONS.map((name) => (
              <Badge key={name} variant="outline">
                {name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        Exemplo ilustrativo: clubes, jogadores e números são fictícios.
      </figcaption>
    </figure>
  );
}
