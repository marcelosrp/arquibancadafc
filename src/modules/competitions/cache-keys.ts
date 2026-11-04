/** Single source of truth for ApiCache keys, shared by readers and the scheduled refresh. */
export const cacheKeys = {
  standings: (league: number, season: number) => `standings:${league}:${season}`,
  topscorers: (league: number, season: number) => `topscorers:${league}:${season}`,
  topassists: (league: number, season: number) => `topassists:${league}:${season}`,
  fixtures: (team: number, season: number) => `fixtures:v2:${team}:${season}`,
};
