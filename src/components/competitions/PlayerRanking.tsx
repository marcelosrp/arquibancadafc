import { LastUpdated } from "@/components/dashboard/LastUpdated";
import { Unavailable } from "@/components/dashboard/Unavailable";
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
    <section>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {ranking.status !== "ok" ? (
        <Unavailable />
      ) : (
        <>
          <ol className="text-sm">
            {ranking.data.slice(0, limit).map((p, i) => (
              <li key={p.playerExternalId}>
                {i + 1}. {p.name} ({p.team}) · {p.value}
              </li>
            ))}
          </ol>
          <LastUpdated fetchedAt={ranking.fetchedAt} stale={ranking.stale} />
        </>
      )}
    </section>
  );
}
