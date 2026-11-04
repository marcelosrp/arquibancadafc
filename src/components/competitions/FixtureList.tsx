import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { Unavailable } from "@/components/dashboard/Unavailable";
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
      {dateFormatter.format(new Date(f.date))} · {f.home.name}{" "}
      {hasScore ? `${f.home.score} x ${f.away.score}` : "x"} {f.away.name}
    </li>
  );
}

function Group({ title, items, empty }: { title: string; items: FixtureDTO[]; empty: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="text-sm">
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
    <section>
      <h2 className="mb-2 font-semibold">Partidas do clube</h2>
      {fixtures.status !== "ok" ? (
        <Unavailable />
      ) : (
        <div className="flex flex-col gap-3">
          <Group title="Próximas" items={fixtures.data.upcoming} empty="Sem próxima partida" />
          <Group title="Anteriores" items={fixtures.data.past} empty="Sem partidas" />
          <LastUpdated fetchedAt={fixtures.fetchedAt} stale={fixtures.stale} />
        </div>
      )}
    </section>
  );
}
