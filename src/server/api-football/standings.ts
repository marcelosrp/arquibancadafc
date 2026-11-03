import { z } from "zod";
import type { StandingRow, Standings } from "@/modules/competitions/types";
import { ApiFootballError, apiGet } from "@/server/api-football/client";

const rowSchema = z.looseObject({
  rank: z.number().int(),
  team: z.looseObject({
    id: z.number().int(),
    name: z.string().min(1),
    logo: z.string().nullish(),
  }),
  points: z.number(),
  goalsDiff: z.number().nullish(),
  group: z.string().nullish(),
  all: z.looseObject({ played: z.number() }),
});

const standingsSchema = z.array(
  z.looseObject({
    league: z.looseObject({ standings: z.array(z.array(rowSchema)) }),
  }),
);

export type StandingsItem = z.infer<typeof standingsSchema>;

export function parseStandings(raw: unknown): StandingsItem {
  const result = standingsSchema.safeParse(raw);
  if (!result.success) {
    throw new ApiFootballError("bad_response", "Unexpected /standings response shape");
  }
  return result.data;
}

function mapRow(row: z.infer<typeof rowSchema>): StandingRow {
  return {
    rank: row.rank,
    teamExternalId: row.team.id,
    teamName: row.team.name,
    teamLogo: row.team.logo ? row.team.logo : null,
    points: row.points,
    played: row.all.played,
    goalsDiff: row.goalsDiff ?? 0,
  };
}

/** `null` = the provider has no standings (e.g. knockout cups). Several groups never become a league table. */
export function mapStandings(items: StandingsItem): Standings | null {
  const groups = (items[0]?.league.standings ?? []).filter((g) => g.length > 0);
  if (groups.length === 0) return null;
  if (groups.length === 1) return { format: "table", rows: groups[0].map(mapRow) };
  return {
    format: "stages",
    stages: groups.map((g, i) => ({ name: g[0].group ?? `Grupo ${i + 1}`, rows: g.map(mapRow) })),
  };
}

export async function fetchStandings(league: number, season: number): Promise<Standings | null> {
  return mapStandings(parseStandings(await apiGet<unknown>("/standings", { league, season })));
}
