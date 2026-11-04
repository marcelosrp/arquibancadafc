import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { Unavailable } from "@/components/dashboard/Unavailable";
import type { Availability, Standings } from "@/modules/competitions/types";
import { StagesView } from "./StagesView";
import { StandingsTable } from "./StandingsTable";

export function CompetitionStandings({
  standings,
  highlightTeamExternalId,
}: {
  standings: Availability<Standings>;
  highlightTeamExternalId?: number;
}) {
  if (standings.status !== "ok") return <Unavailable />;
  return (
    <>
      {standings.data.format === "stages" ? (
        <StagesView
          stages={standings.data.stages}
          highlightTeamExternalId={highlightTeamExternalId}
        />
      ) : (
        <StandingsTable
          rows={standings.data.rows}
          highlightTeamExternalId={highlightTeamExternalId}
        />
      )}
      <LastUpdated fetchedAt={standings.fetchedAt} stale={standings.stale} />
    </>
  );
}
