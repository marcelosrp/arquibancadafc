import type { Availability, Standings } from "./types";

export type Participant = { teamExternalId: number; teamName: string; teamLogo: string | null };

/** Participants come from the standings themselves (no extra API call). */
export function participantsFrom(standings: Availability<Standings>): Availability<Participant[]> {
  if (standings.status !== "ok") return standings;
  const rows =
    standings.data.format === "table"
      ? standings.data.rows
      : standings.data.stages.flatMap((s) => s.rows);
  const seen = new Map<number, Participant>();
  for (const r of rows) {
    if (!seen.has(r.teamExternalId)) {
      seen.set(r.teamExternalId, {
        teamExternalId: r.teamExternalId,
        teamName: r.teamName,
        teamLogo: r.teamLogo,
      });
    }
  }
  return { ...standings, data: [...seen.values()] };
}
