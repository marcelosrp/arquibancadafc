import { z } from "zod";
import { ApiFootballError, apiGet } from "@/server/api-football/client";

const leagueItemSchema = z.looseObject({
  league: z.looseObject({
    id: z.number().int(),
    name: z.string().min(1),
    type: z.string().nullish(),
  }),
  country: z.looseObject({ name: z.string().nullish() }).nullish(),
  seasons: z.array(
    z.looseObject({
      year: z.number().int(),
      start: z.string().nullish(),
      end: z.string().nullish(),
      current: z.boolean(),
    }),
  ),
});

export type LeagueItem = z.infer<typeof leagueItemSchema>;

export type LeagueDTO = {
  externalId: number;
  name: string;
  type: string | null;
  country: string | null;
  season: { year: number; startDate: string | null; endDate: string | null; current: boolean };
};

export function parseLeagues(raw: unknown): LeagueItem[] {
  const result = z.array(leagueItemSchema).safeParse(raw);
  if (!result.success) {
    throw new ApiFootballError("bad_response", "Unexpected /leagues response shape");
  }
  return result.data;
}

/** One DTO per league; the season is the most recent one returned (the request filters by season). */
export function mapLeagues(items: LeagueItem[]): LeagueDTO[] {
  const out: LeagueDTO[] = [];
  for (const item of items) {
    const season = [...item.seasons].sort((a, b) => b.year - a.year)[0];
    if (!season) continue;
    out.push({
      externalId: item.league.id,
      name: item.league.name,
      type: item.league.type ?? null,
      country: item.country?.name ?? null,
      season: {
        year: season.year,
        startDate: season.start ?? null,
        endDate: season.end ?? null,
        current: season.current,
      },
    });
  }
  return out;
}

export async function fetchTeamLeagues(
  params: { team: number } & ({ season: number } | { current: "true" }),
): Promise<LeagueDTO[]> {
  return mapLeagues(parseLeagues(await apiGet<unknown>("/leagues", params)));
}
