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
    <section aria-labelledby="next-match" className="rounded-lg border p-4">
      <h2 id="next-match" className="mb-2 font-semibold">
        Próxima partida
      </h2>
      {match.status !== "ok" ? (
        <Unavailable />
      ) : match.data === null ? (
        <p className="text-sm text-muted-foreground">Sem próxima partida</p>
      ) : (
        <>
          <p>
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
