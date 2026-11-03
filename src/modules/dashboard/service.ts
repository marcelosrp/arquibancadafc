import { prisma } from "@/lib/prisma";
import {
  getStandings,
  getTeamCompetitions,
  getTeamFixtures,
  getTopAssists,
  getTopScorers,
  type Availability,
  type FixtureDTO,
  type PlayerRankingEntry,
  type Standings,
} from "@/modules/competitions/service";

export type DashboardCompetition = {
  id: string;
  name: string;
  type: string;
  standing: Availability<Standings>;
  topScorer: Availability<PlayerRankingEntry>;
  topAssist: Availability<PlayerRankingEntry>;
};

export type Dashboard = {
  team: { name: string; logo: string | null };
  season: number;
  competitions: DashboardCompetition[];
  nextMatch: Availability<FixtureDTO | null>;
};

/** Leader of a ranking: the first entry, keeping availability metadata. */
function leader(ranking: Availability<PlayerRankingEntry[]>): Availability<PlayerRankingEntry> {
  if (ranking.status !== "ok") return ranking;
  const first = ranking.data[0];
  if (!first) return { status: "unavailable", reason: "no_coverage" };
  return { ...ranking, data: first };
}

function nextMatch(
  fixtures: Availability<{ past: FixtureDTO[]; upcoming: FixtureDTO[] }>,
): Availability<FixtureDTO | null> {
  if (fixtures.status !== "ok") return fixtures;
  return { ...fixtures, data: fixtures.data.upcoming[0] ?? null };
}

export async function getDashboard(userId: string): Promise<Dashboard> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { favoriteTeam: { select: { id: true, name: true, logo: true } } },
  });
  const team = user.favoriteTeam;

  const { season, competitions } = await getTeamCompetitions(team.id);

  const [fixtures, cards] = await Promise.all([
    getTeamFixtures(team.id, season),
    Promise.all(
      competitions.map(async (c): Promise<DashboardCompetition> => {
        const [standing, scorers, assists] = await Promise.all([
          getStandings(c.id, season),
          getTopScorers(c.id, season),
          getTopAssists(c.id, season),
        ]);
        return {
          id: c.id,
          name: c.name,
          type: c.type,
          standing,
          topScorer: leader(scorers),
          topAssist: leader(assists),
        };
      }),
    ),
  ]);

  return {
    team: { name: team.name, logo: team.logo },
    season,
    competitions: cards,
    nextMatch: nextMatch(fixtures),
  };
}
