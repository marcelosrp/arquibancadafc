import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { resolveSeason } from "@/lib/season";
import { ApiFootballError } from "@/server/api-football/client";
import { fetchTeamFixtures } from "@/server/api-football/fixtures";
import { fetchTeamLeagues } from "@/server/api-football/leagues";
import { fetchTopAssists, fetchTopScorers } from "@/server/api-football/players";
import { fetchStandings } from "@/server/api-football/standings";
import { getOrFetch } from "@/server/cache/api-cache";
import { TTL_SECONDS } from "@/server/cache/ttl";
import type {
  Availability,
  FixtureDTO,
  PlayerRankingEntry,
  Standings,
  TeamCompetitionDTO,
} from "./types";

export type * from "./types";

export class TeamNotFoundError extends Error {
  constructor() {
    super("team_not_found");
    this.name = "TeamNotFoundError";
  }
}

export class CompetitionNotFoundError extends Error {
  constructor() {
    super("competition_not_found");
    this.name = "CompetitionNotFoundError";
  }
}

async function requireTeam(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new TeamNotFoundError();
  return team;
}

async function requireCompetition(competitionId: string) {
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new CompetitionNotFoundError();
  return competition;
}

/**
 * Cached fetch as an `Availability`: provider failures without a stored copy
 * become `provider_error`; when `project` returns null the data is `no_coverage`.
 */
async function availability<T, R>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  project: (data: T) => R | null,
): Promise<Availability<R>> {
  try {
    const cached = await getOrFetch(key, ttl, fetcher);
    const data = project(cached.data);
    if (data === null) return { status: "unavailable", reason: "no_coverage" };
    return { status: "ok", data, fetchedAt: cached.fetchedAt, stale: cached.stale };
  } catch (error) {
    if (error instanceof ApiFootballError) {
      return { status: "unavailable", reason: "provider_error" };
    }
    throw error;
  }
}

export async function getTeamCompetitions(
  teamId: string,
): Promise<{ season: number; competitions: TeamCompetitionDTO[] }> {
  const team = await requireTeam(teamId);
  const override = env.SEASON_OVERRIDE;
  const key = `leagues:team:${team.externalId}:${override ?? "current"}`;
  const { data: leagues } = await getOrFetch(key, TTL_SECONDS.leagues, () =>
    fetchTeamLeagues(
      override !== undefined
        ? { team: team.externalId, season: override }
        : { team: team.externalId, current: "true" },
    ),
  );

  const season = resolveSeason({
    override,
    apiSeasons: leagues.map((l) => ({ year: l.season.year, current: l.season.current })),
  });

  const competitions: TeamCompetitionDTO[] = [];
  for (const league of leagues) {
    if (league.season.year !== season) continue;
    const competition = await prisma.competition.upsert({
      where: { externalId: league.externalId },
      create: {
        externalId: league.externalId,
        name: league.name,
        type: league.type,
        country: league.country,
      },
      update: { name: league.name, type: league.type, country: league.country },
    });
    const dates = {
      startDate: league.season.startDate ? new Date(league.season.startDate) : null,
      endDate: league.season.endDate ? new Date(league.season.endDate) : null,
    };
    const seasonRow = await prisma.season.upsert({
      where: { competitionId_year: { competitionId: competition.id, year: season } },
      create: { competitionId: competition.id, year: season, ...dates },
      update: dates,
    });
    await prisma.teamCompetition.upsert({
      where: { teamId_seasonId: { teamId: team.id, seasonId: seasonRow.id } },
      create: { teamId: team.id, seasonId: seasonRow.id },
      update: {},
    });
    competitions.push({
      id: competition.id,
      externalId: competition.externalId,
      name: competition.name,
      type: competition.type ?? "League",
    });
  }
  return { season, competitions };
}

export async function getStandings(
  competitionId: string,
  season: number,
): Promise<Availability<Standings>> {
  const { externalId } = await requireCompetition(competitionId);
  return availability(
    `standings:${externalId}:${season}`,
    TTL_SECONDS.standings,
    // `null` is cached too, so competitions without standings don't burn quota.
    () => fetchStandings(externalId, season),
    (data: Standings | null) => data,
  );
}

export async function getTopScorers(
  competitionId: string,
  season: number,
): Promise<Availability<PlayerRankingEntry[]>> {
  const { externalId } = await requireCompetition(competitionId);
  return availability(
    `topscorers:${externalId}:${season}`,
    TTL_SECONDS.topscorers,
    () => fetchTopScorers(externalId, season),
    (data) => (data.length > 0 ? data : null),
  );
}

export async function getTopAssists(
  competitionId: string,
  season: number,
): Promise<Availability<PlayerRankingEntry[]>> {
  const { externalId } = await requireCompetition(competitionId);
  return availability(
    `topassists:${externalId}:${season}`,
    TTL_SECONDS.topassists,
    () => fetchTopAssists(externalId, season),
    (data) => (data.length > 0 ? data : null),
  );
}

const NOT_STARTED = new Set(["NS", "TBD", "PST"]);

/** Upcoming = not started and in the future; everything else (finished, live, cancelled) is past. */
export function splitFixtures(fixtures: FixtureDTO[], now = new Date()) {
  const past: FixtureDTO[] = [];
  const upcoming: FixtureDTO[] = [];
  for (const f of fixtures) {
    if (NOT_STARTED.has(f.status) && new Date(f.date) > now) upcoming.push(f);
    else past.push(f);
  }
  past.sort((a, b) => b.date.localeCompare(a.date));
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  return { past, upcoming };
}

export async function getTeamFixtures(
  teamId: string,
  season: number,
): Promise<Availability<{ past: FixtureDTO[]; upcoming: FixtureDTO[] }>> {
  const team = await requireTeam(teamId);
  // The full list is cached; the past/upcoming split happens at read time.
  return availability(
    `fixtures:v2:${team.externalId}:${season}`,
    TTL_SECONDS.fixtures,
    () => fetchTeamFixtures(team.externalId, season),
    (data) => splitFixtures(data),
  );
}

/** Season to show for a competition: explicit request, then SEASON_OVERRIDE, then the latest stored one. */
export async function resolveCompetitionSeason(
  competitionId: string,
  requested?: number,
): Promise<number | null> {
  if (requested !== undefined) return requested;
  if (env.SEASON_OVERRIDE !== undefined) return env.SEASON_OVERRIDE;
  const latest = await prisma.season.findFirst({
    where: { competitionId },
    orderBy: { year: "desc" },
    select: { year: true },
  });
  return latest?.year ?? null;
}

export async function getCompetition(competitionId: string, requestedSeason?: number) {
  const competition = await requireCompetition(competitionId);
  const season = await resolveCompetitionSeason(competition.id, requestedSeason);
  if (season === null) throw new CompetitionNotFoundError();
  return {
    id: competition.id,
    externalId: competition.externalId,
    name: competition.name,
    type: competition.type ?? "League",
    season,
  };
}
