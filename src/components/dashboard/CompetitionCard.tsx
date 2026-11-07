import Link from "next/link";
import type { DashboardCompetition } from "@/modules/dashboard/service";
import type { Availability, PlayerRankingEntry } from "@/modules/competitions/service";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LastUpdated } from "./LastUpdated";
import { Unavailable } from "./Unavailable";

function Leader({ title, leader }: { title: string; leader: Availability<PlayerRankingEntry> }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
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
    <ol className="flex flex-col gap-1 text-sm tabular-nums">
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
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center gap-3">
        {/* The API gives no competition logo, so the initials fallback is used. */}
        <TeamLogo name={competition.name} src={null} size={40} />
        <CardTitle className="min-w-0 truncate font-heading text-xl font-bold uppercase tracking-wide">
          <Link href={`/competicoes/${competition.id}`} className="hover:text-primary hover:underline">
            {competition.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <StandingSummary standing={standing} />
        <Separator />
        <Leader title="Artilheiro" leader={competition.topScorer} />
        <Leader title="Líder de assistências" leader={competition.topAssist} />
        {standing.status === "ok" && (
          <LastUpdated fetchedAt={standing.fetchedAt} stale={standing.stale} />
        )}
      </CardContent>
    </Card>
  );
}
