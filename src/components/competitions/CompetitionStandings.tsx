import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { Unavailable } from "@/components/dashboard/Unavailable";
import type { Availability, Standings } from "@/modules/competitions/types";
import { StagesView } from "./StagesView";
import { MIN_ROWS_FOR_ZONES, StandingsTable, ZoneLegend } from "./StandingsTable";

export function CompetitionStandings({
  standings,
  highlightTeamExternalId,
}: {
  standings: Availability<Standings>;
  highlightTeamExternalId?: number;
}) {
  if (standings.status !== "ok") return <Unavailable />;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {standings.data.format === "stages" ? (
        <StagesView
          stages={standings.data.stages}
          highlightTeamExternalId={highlightTeamExternalId}
        />
      ) : (
        <>
          <StandingsTable
            rows={standings.data.rows}
            highlightTeamExternalId={highlightTeamExternalId}
            showZones
          />
          {standings.data.rows.length >= MIN_ROWS_FOR_ZONES && <ZoneLegend />}
        </>
      )}
      <LastUpdated fetchedAt={standings.fetchedAt} stale={standings.stale} />
    </div>
  );
}
