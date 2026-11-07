import { Unavailable } from "@/components/dashboard/Unavailable";
import type { CompetitionDetail } from "@/modules/competitions/detail";
import { CompetitionStandings } from "./CompetitionStandings";
import { FixtureList } from "./FixtureList";
import { PlayerRanking } from "./PlayerRanking";

const h2 = "font-heading text-xl font-bold uppercase tracking-wide";

export function CompetitionDetailView({ detail }: { detail: CompetitionDetail }) {
  const { participants, standings } = detail;
  const inStages = standings.status === "ok" && standings.data.format === "stages";
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide sm:text-4xl">
          {detail.competition.name}
        </h1>
        <p className="text-sm text-muted-foreground tabular-nums">Temporada {detail.season}</p>
      </header>
      <section className="flex min-w-0 flex-col gap-2">
        <h2 className={h2}>{inStages ? "Fases" : "Classificação"}</h2>
        <CompetitionStandings
          standings={standings}
          highlightTeamExternalId={detail.favoriteTeamExternalId}
        />
      </section>
      <div className="grid gap-8 md:grid-cols-2">
        <PlayerRanking title="Artilharia" ranking={detail.topScorers} />
        <PlayerRanking title="Assistências" ranking={detail.topAssists} />
      </div>
      <FixtureList fixtures={detail.fixtures} />
      <section className="flex flex-col gap-2">
        <h2 className={h2}>Clubes participantes</h2>
        {participants.status !== "ok" ? (
          <Unavailable />
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {participants.data.map((p) => p.teamName).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
