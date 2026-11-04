import type { StandingRow } from "@/modules/competitions/types";
import { StandingsTable } from "./StandingsTable";

export function StagesView({
  stages,
  highlightTeamExternalId,
}: {
  stages: { name: string; rows: StandingRow[] }[];
  highlightTeamExternalId?: number;
}) {
  return (
    <div data-testid="stages-view" className="flex flex-col gap-4">
      {stages.map((stage) => (
        <section key={stage.name}>
          <h3 className="mb-1 text-sm font-medium">{stage.name}</h3>
          <StandingsTable rows={stage.rows} highlightTeamExternalId={highlightTeamExternalId} />
        </section>
      ))}
    </div>
  );
}
