export type Availability<T> =
  | { status: "ok"; data: T; fetchedAt: Date; stale: boolean }
  | { status: "unavailable"; reason: "no_coverage" | "provider_error" };

export type StandingRow = {
  rank: number;
  teamExternalId: number;
  teamName: string;
  teamLogo: string | null;
  points: number;
  played: number;
  goalsDiff: number;
};

export type Standings =
  | { format: "table"; rows: StandingRow[] }
  | { format: "stages"; stages: { name: string; rows: StandingRow[] }[] };

export type PlayerRankingEntry = {
  playerExternalId: number;
  name: string;
  photo: string | null;
  team: string;
  value: number;
};

export type FixtureSide = { name: string; logo: string | null; score: number | null };

export type FixtureDTO = {
  externalId: number;
  /** ISO 8601, UTC. */
  date: string;
  status: string;
  competition: string;
  competitionExternalId: number;
  home: FixtureSide;
  away: FixtureSide;
};

export type TeamCompetitionDTO = {
  id: string;
  externalId: number;
  name: string;
  type: "League" | "Cup" | string;
};
