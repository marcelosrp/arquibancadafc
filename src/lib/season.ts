export type ApiSeason = { year: number; current: boolean };

export function resolveSeason({
  override,
  apiSeasons,
}: {
  override?: number;
  apiSeasons: ApiSeason[];
}): number {
  if (override !== undefined) return override;
  if (apiSeasons.length === 0) throw new Error("season_unavailable");

  const current = apiSeasons.find((s) => s.current);
  if (current) return current.year;

  return Math.max(...apiSeasons.map((s) => s.year));
}
