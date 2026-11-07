import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { Unavailable } from "@/components/dashboard/Unavailable";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { Card } from "@/components/ui/card";
import type { Availability, FixtureDTO } from "@/modules/competitions/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function Item({ f }: { f: FixtureDTO }) {
  const hasScore = f.home.score !== null && f.away.score !== null;
  return (
    <li>
      <Card size="sm" className="gap-2">
        <p className="px-(--card-spacing) text-xs text-muted-foreground tabular-nums">
          {dateFormatter.format(new Date(f.date))}
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-(--card-spacing) text-sm">
          <span className="flex min-w-0 items-center justify-end gap-2 text-right font-medium">
            <span className="truncate">{f.home.name}</span>
            <TeamLogo name={f.home.name} src={f.home.logo} size={24} />
          </span>
          <span className="font-heading text-lg font-bold tabular-nums">
            {hasScore ? `${f.home.score} x ${f.away.score}` : "x"}
          </span>
          <span className="flex min-w-0 items-center gap-2 font-medium">
            <TeamLogo name={f.away.name} src={f.away.logo} size={24} />
            <span className="truncate">{f.away.name}</span>
          </span>
        </div>
      </Card>
    </li>
  );
}

function Group({ title, items, empty }: { title: string; items: FixtureDTO[]; empty: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((f) => (
            <Item key={f.externalId} f={f} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function FixtureList({
  fixtures,
}: {
  fixtures: Availability<{ past: FixtureDTO[]; upcoming: FixtureDTO[] }>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide">Partidas do clube</h2>
      {fixtures.status !== "ok" ? (
        <Unavailable />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Group title="Próximas" items={fixtures.data.upcoming} empty="Sem próxima partida" />
          <Group title="Anteriores" items={fixtures.data.past} empty="Sem partidas" />
          <div className="md:col-span-2">
            <LastUpdated fetchedAt={fixtures.fetchedAt} stale={fixtures.stale} />
          </div>
        </div>
      )}
    </section>
  );
}
