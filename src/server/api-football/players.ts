import { z } from "zod";
import type { PlayerRankingEntry } from "@/modules/competitions/types";
import { ApiFootballError, apiGet } from "@/server/api-football/client";

const playerItemSchema = z.looseObject({
  player: z.looseObject({
    id: z.number().int(),
    name: z.string().min(1),
    photo: z.string().nullish(),
  }),
  statistics: z.array(
    z.looseObject({
      team: z.looseObject({ name: z.string() }).nullish(),
      goals: z
        .looseObject({ total: z.number().nullish(), assists: z.number().nullish() })
        .nullish(),
    }),
  ),
});

export type PlayerItem = z.infer<typeof playerItemSchema>;

export function parsePlayers(raw: unknown): PlayerItem[] {
  const result = z.array(playerItemSchema).safeParse(raw);
  if (!result.success) {
    throw new ApiFootballError("bad_response", "Unexpected /players response shape");
  }
  return result.data;
}

/** Entries with a missing value are dropped: absent data is never shown as 0. */
export function mapPlayers(
  items: PlayerItem[],
  metric: "goals" | "assists",
): PlayerRankingEntry[] {
  const out: PlayerRankingEntry[] = [];
  for (const item of items) {
    const stat = item.statistics[0];
    const value = metric === "goals" ? stat?.goals?.total : stat?.goals?.assists;
    if (value === null || value === undefined) continue;
    out.push({
      playerExternalId: item.player.id,
      name: item.player.name,
      photo: item.player.photo ? item.player.photo : null,
      team: stat?.team?.name ?? "",
      value,
    });
  }
  return out;
}

export async function fetchTopScorers(league: number, season: number) {
  const raw = await apiGet<unknown>("/players/topscorers", { league, season });
  return mapPlayers(parsePlayers(raw), "goals");
}

export async function fetchTopAssists(league: number, season: number) {
  const raw = await apiGet<unknown>("/players/topassists", { league, season });
  return mapPlayers(parsePlayers(raw), "assists");
}
