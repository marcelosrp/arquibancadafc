/** Relaxed vs. the brainstorm because of the free API plan (100 req/day). */
export const TTL_SECONDS = {
  standings: 3 * 3600,
  topscorers: 6 * 3600,
  topassists: 6 * 3600,
  fixtures: 6 * 3600,
  leagues: 24 * 3600,
} as const;
