import type { Availability, FixtureDTO } from "@/modules/competitions/service";
import { LastUpdated } from "./LastUpdated";
import { Unavailable } from "./Unavailable";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function NextMatch({ match }: { match: Availability<FixtureDTO | null> }) {
  return (
    <section
      aria-labelledby="next-match"
      className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-card p-4 sm:p-6"
    >
      <h2
        id="next-match"
        className="font-heading text-sm font-semibold uppercase tracking-widest text-primary"
      >
        Próxima partida
      </h2>
      {match.status !== "ok" ? (
        <Unavailable />
      ) : match.data === null ? (
        <p className="text-sm text-muted-foreground">Sem próxima partida</p>
      ) : (
        <>
          <p className="font-heading text-2xl font-bold uppercase tabular-nums sm:text-4xl">
            {match.data.home.name} x {match.data.away.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {match.data.competition} · {dateFormatter.format(new Date(match.data.date))}
          </p>
        </>
      )}
      {match.status === "ok" && <LastUpdated fetchedAt={match.fetchedAt} stale={match.stale} />}
    </section>
  );
}
