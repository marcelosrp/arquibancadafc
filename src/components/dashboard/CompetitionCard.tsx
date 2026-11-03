import Link from "next/link";
import type { DashboardCompetition } from "@/modules/dashboard/service";
import type { Availability, PlayerRankingEntry } from "@/modules/competitions/service";
import { LastUpdated } from "./LastUpdated";
import { Unavailable } from "./Unavailable";

function Leader({ title, leader }: { title: string; leader: Availability<PlayerRankingEntry> }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      {leader.status === "ok" ? (
        <p className="text-sm">
          {leader.data.name} ({leader.data.team}) · {leader.data.value}
        </p>
      ) : (
        <Unavailable />
      )}
    </div>
  );
}

function StandingSummary({ standing }: { standing: DashboardCompetition["standing"] }) {
  if (standing.status !== "ok") return <Unavailable />;
  // Cups and group stages never render as a league table.
  if (standing.data.format === "stages") {
    return (
      <p className="text-sm">
        Disputada em fases: {standing.data.stages.map((s) => s.name).join(", ")}
      </p>
    );
  }
  const top = standing.data.rows.slice(0, 5);
  return (
    <ol className="text-sm">
      {top.map((row) => (
        <li key={row.teamExternalId}>
          {row.rank}. {row.teamName} · {row.points} pts
        </li>
      ))}
    </ol>
  );
}

export function CompetitionCard({ competition }: { competition: DashboardCompetition }) {
  const { standing } = competition;
  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-semibold">
        <Link href={`/competicoes/${competition.id}`}>{competition.name}</Link>
      </h2>
      <StandingSummary standing={standing} />
      <Leader title="Artilheiro" leader={competition.topScorer} />
      <Leader title="Líder de assistências" leader={competition.topAssist} />
      {standing.status === "ok" && (
        <LastUpdated fetchedAt={standing.fetchedAt} stale={standing.stale} />
      )}
    </article>
  );
}
