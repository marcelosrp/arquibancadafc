import { z } from "zod";
import { env } from "@/lib/env";
import { resolveSeason } from "@/lib/season";
import { ApiFootballError, apiGet } from "@/server/api-football/client";

export type TeamDTO = {
  externalId: number;
  name: string;
  logo: string | null;
  country: string;
};

/** API-Football league ids: Série A, B, C and D of the Brasileirão. */
export const BRAZILIAN_NATIONAL_LEAGUES = [71, 72, 75, 76] as const;

const teamItemSchema = z.looseObject({
  team: z.looseObject({
    id: z.number().int(),
    name: z.string().min(1),
    country: z.string().nullish(),
    national: z.boolean().nullish(),
    logo: z.string().nullish(),
  }),
});

export type TeamItem = z.infer<typeof teamItemSchema>;

export function parseTeams(raw: unknown): TeamItem[] {
  const result = z.array(teamItemSchema).safeParse(raw);
  if (!result.success) {
    throw new ApiFootballError("bad_response", "Unexpected /teams response shape");
  }
  return result.data;
}

export function mapTeam(item: TeamItem): TeamDTO {
  const { team } = item;
  return {
    externalId: team.id,
    name: team.name,
    logo: team.logo ? team.logo : null,
    country: team.country || "Brazil",
  };
}

const leagueSeasonsSchema = z.array(
  z.looseObject({
    seasons: z.array(z.object({ year: z.number().int(), current: z.boolean() })),
  }),
);

async function resolveTeamsSeason(): Promise<number> {
  if (env.SEASON_OVERRIDE !== undefined) {
    return resolveSeason({ override: env.SEASON_OVERRIDE, apiSeasons: [] });
  }
  const raw = await apiGet<unknown>("/leagues", { id: BRAZILIAN_NATIONAL_LEAGUES[0] });
  const parsed = leagueSeasonsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiFootballError("bad_response", "Unexpected /leagues response shape");
  }
  return resolveSeason({ apiSeasons: parsed.data[0]?.seasons ?? [] });
}

export async function fetchTeamsByLeague(league: number, season: number): Promise<TeamItem[]> {
  return parseTeams(await apiGet<unknown>("/teams", { league, season }));
}

/** Clubs (no national teams) from the Brazilian national leagues, deduped by externalId. */
export async function fetchBrazilianTeams(): Promise<TeamDTO[]> {
  const season = await resolveTeamsSeason();
  const byId = new Map<number, TeamDTO>();
  // Sequential on purpose: free plan allows ~10 requests/minute.
  for (const league of BRAZILIAN_NATIONAL_LEAGUES) {
    for (const item of await fetchTeamsByLeague(league, season)) {
      if (item.team.national === true) continue;
      byId.set(item.team.id, mapTeam(item));
    }
  }
  return [...byId.values()];
}
