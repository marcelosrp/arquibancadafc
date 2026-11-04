import { prisma } from "@/lib/prisma";
import {
  getCompetition,
  getStandings,
  getTeamFixtures,
  getTopAssists,
  getTopScorers,
  type Availability,
  type FixtureDTO,
  type PlayerRankingEntry,
  type Standings,
} from "./service";
import { participantsFrom, type Participant } from "./participants";

export type { Participant };

export type CompetitionDetail = {
  competition: { id: string; name: string; type: string };
  season: number;
  /** External id of the signed-in user's club, used to highlight it. */
  favoriteTeamExternalId: number;
  standings: Availability<Standings>;
  topScorers: Availability<PlayerRankingEntry[]>;
  topAssists: Availability<PlayerRankingEntry[]>;
  participants: Availability<Participant[]>;
  fixtures: Availability<{ past: FixtureDTO[]; upcoming: FixtureDTO[] }>;
};

export async function getCompetitionDetail(
  competitionId: string,
  userId: string,
  requestedSeason?: number,
): Promise<CompetitionDetail> {
  const competition = await getCompetition(competitionId, requestedSeason);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { favoriteTeam: { select: { id: true, externalId: true } } },
  });
  const team = user.favoriteTeam;

  const [standings, topScorers, topAssists, allFixtures] = await Promise.all([
    getStandings(competition.id, competition.season),
    getTopScorers(competition.id, competition.season),
    getTopAssists(competition.id, competition.season),
    getTeamFixtures(team.id, competition.season),
  ]);

  const inThisCompetition = (f: FixtureDTO) => f.competitionExternalId === competition.externalId;
  const fixtures: CompetitionDetail["fixtures"] =
    allFixtures.status === "ok"
      ? {
          ...allFixtures,
          data: {
            past: allFixtures.data.past.filter(inThisCompetition),
            upcoming: allFixtures.data.upcoming.filter(inThisCompetition),
          },
        }
      : allFixtures;

  return {
    competition: { id: competition.id, name: competition.name, type: competition.type },
    season: competition.season,
    favoriteTeamExternalId: team.externalId,
    standings,
    topScorers,
    topAssists,
    participants: participantsFrom(standings),
    fixtures,
  };
}
