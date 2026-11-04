import { Unavailable } from "@/components/dashboard/Unavailable";
import type { CompetitionDetail } from "@/modules/competitions/detail";
import { CompetitionStandings } from "./CompetitionStandings";
import { FixtureList } from "./FixtureList";
import { PlayerRanking } from "./PlayerRanking";

export function CompetitionDetailView({ detail }: { detail: CompetitionDetail }) {
  const { participants, standings } = detail;
  const inStages = standings.status === "ok" && standings.data.format === "stages";
  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{detail.competition.name}</h1>
        <p className="text-sm text-muted-foreground">Temporada {detail.season}</p>
      </header>
      <section>
        <h2 className="mb-2 font-semibold">{inStages ? "Fases" : "Classificação"}</h2>
        <CompetitionStandings
          standings={standings}
          highlightTeamExternalId={detail.favoriteTeamExternalId}
        />
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <PlayerRanking title="Artilharia" ranking={detail.topScorers} />
        <PlayerRanking title="Assistências" ranking={detail.topAssists} />
      </div>
      <FixtureList fixtures={detail.fixtures} />
      <section>
        <h2 className="mb-2 font-semibold">Clubes participantes</h2>
        {participants.status !== "ok" ? (
          <Unavailable />
        ) : (
          <p className="text-sm">{participants.data.map((p) => p.teamName).join(", ")}</p>
        )}
      </section>
    </>
  );
}
