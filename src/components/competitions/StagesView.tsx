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
    <div data-testid="stages-view" className="flex flex-col gap-5">
      {stages.map((stage) => (
        <section key={stage.name} className="flex flex-col gap-2">
          <h3 className="font-heading text-lg font-semibold uppercase tracking-wide">
            {stage.name}
          </h3>
          <StandingsTable rows={stage.rows} highlightTeamExternalId={highlightTeamExternalId} />
        </section>
      ))}
    </div>
  );
}
