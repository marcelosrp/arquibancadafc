import { z } from "zod";
import type { FixtureDTO, FixtureSide } from "@/modules/competitions/types";
import { ApiFootballError, apiGet } from "@/server/api-football/client";

const sideSchema = z.looseObject({ name: z.string(), logo: z.string().nullish() });

const fixtureItemSchema = z.looseObject({
  fixture: z.looseObject({
    id: z.number().int(),
    date: z.string().refine((d) => !Number.isNaN(Date.parse(d))),
    status: z.looseObject({ short: z.string().nullish() }),
  }),
  league: z.looseObject({ name: z.string() }),
  teams: z.looseObject({ home: sideSchema, away: sideSchema }),
  goals: z.looseObject({ home: z.number().nullish(), away: z.number().nullish() }),
});

export type FixtureItem = z.infer<typeof fixtureItemSchema>;

export function parseFixtures(raw: unknown): FixtureItem[] {
  const result = z.array(fixtureItemSchema).safeParse(raw);
  if (!result.success) {
    throw new ApiFootballError("bad_response", "Unexpected /fixtures response shape");
  }
  return result.data;
}

function side(team: z.infer<typeof sideSchema>, score: number | null | undefined): FixtureSide {
  return { name: team.name, logo: team.logo ? team.logo : null, score: score ?? null };
}

export function mapFixtures(items: FixtureItem[]): FixtureDTO[] {
  return items.map((i) => ({
    externalId: i.fixture.id,
    date: new Date(i.fixture.date).toISOString(),
    status: i.fixture.status.short ?? "",
    competition: i.league.name,
    home: side(i.teams.home, i.goals.home),
    away: side(i.teams.away, i.goals.away),
  }));
}

export async function fetchTeamFixtures(team: number, season: number): Promise<FixtureDTO[]> {
  return mapFixtures(parseFixtures(await apiGet<unknown>("/fixtures", { team, season })));
}
