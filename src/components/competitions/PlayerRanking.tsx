import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { Unavailable } from "@/components/dashboard/Unavailable";
import { Card } from "@/components/ui/card";
import type { Availability, PlayerRankingEntry } from "@/modules/competitions/types";

export function PlayerRanking({
  title,
  ranking,
  limit = 10,
}: {
  title: string;
  ranking: Availability<PlayerRankingEntry[]>;
  limit?: number;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h2 className="font-heading text-xl font-bold uppercase tracking-wide">{title}</h2>
      {ranking.status !== "ok" ? (
        <Unavailable />
      ) : (
        <>
          <Card className="gap-0 py-1">
            <ol className="divide-y divide-border tabular-nums">
              {ranking.data.slice(0, limit).map((p, i) => (
                <li key={p.playerExternalId} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="w-6 text-center font-heading text-lg font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.team}</span>
                  </span>
                  <span className="font-heading text-lg font-bold">{p.value}</span>
                </li>
              ))}
            </ol>
          </Card>
          <LastUpdated fetchedAt={ranking.fetchedAt} stale={ranking.stale} />
        </>
      )}
    </section>
  );
}
