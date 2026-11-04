import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ApiFootballError } from "@/server/api-football/client";
import { fetchTeamFixtures } from "@/server/api-football/fixtures";
import { fetchTopAssists, fetchTopScorers } from "@/server/api-football/players";
import { fetchStandings } from "@/server/api-football/standings";
import { getOrFetch } from "@/server/cache/api-cache";
import { TTL_SECONDS } from "@/server/cache/ttl";
import { cacheKeys } from "@/modules/competitions/cache-keys";

type Job = { key: string; ttl: number; fetcher: () => Promise<unknown> };

/** One job per distinct cache key, so N fans of one club cost the same as one. */
async function collectJobs(): Promise<Job[]> {
  const allLinks = await prisma.teamCompetition.findMany({
    where: { team: { users: { some: {} } } },
    select: {
      team: { select: { externalId: true } },
      season: { select: { year: true, competition: { select: { externalId: true } } } },
    },
  });
  // Only the season in use: SEASON_OVERRIDE, else the latest stored per competition.
  const latest = new Map<number, number>();
  for (const { season } of allLinks) {
    const id = season.competition.externalId;
    latest.set(id, Math.max(latest.get(id) ?? 0, season.year));
  }
  const links = allLinks.filter(({ season }) =>
    season.year === (env.SEASON_OVERRIDE ?? latest.get(season.competition.externalId)),
  );
  const jobs = new Map<string, Job>();
  const add = (job: Job) => jobs.set(job.key, job);
  for (const { team, season } of links) {
    const league = season.competition.externalId;
    const year = season.year;
    add({
      key: cacheKeys.standings(league, year),
      ttl: TTL_SECONDS.standings,
      fetcher: () => fetchStandings(league, year),
    });
    add({
      key: cacheKeys.topscorers(league, year),
      ttl: TTL_SECONDS.topscorers,
      fetcher: () => fetchTopScorers(league, year),
    });
    add({
      key: cacheKeys.topassists(league, year),
      ttl: TTL_SECONDS.topassists,
      fetcher: () => fetchTopAssists(league, year),
    });
    add({
      key: cacheKeys.fixtures(team.externalId, year),
      ttl: TTL_SECONDS.fixtures,
      fetcher: () => fetchTeamFixtures(team.externalId, year),
    });
  }
  return [...jobs.values()];
}

/**
 * Warms the shared cache for favorited clubs. Skips fresh keys, refreshes the
 * oldest expired (or missing) first, and stops at `budget` external calls or
 * on the first `rate_limited`. Never spends the last QUOTA_RESERVE daily requests.
 */
export const CRON_INTERVAL_SECONDS = 3 * 3600;
/** Daily quota left untouched for on-demand reads (free plan: 100/day). */
export const QUOTA_RESERVE = 30;

async function remainingQuota(): Promise<number | null> {
  const last = await prisma.apiUsage.findFirst({
    where: { remainingDay: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { remainingDay: true },
  });
  return last?.remainingDay ?? null;
}

export async function refreshAll(
  budget: number,
  { horizonSeconds = CRON_INTERVAL_SECONDS }: { horizonSeconds?: number } = {},
): Promise<{ refreshed: number; skipped: number }> {
  const remaining = await remainingQuota();
  if (remaining !== null) budget = Math.min(budget, Math.max(0, remaining - QUOTA_RESERVE));
  const jobs = await collectJobs();
  const rows = await prisma.apiCache.findMany({
    where: { key: { in: jobs.map((j) => j.key) } },
    select: { key: true, expiresAt: true },
  });
  const expiry = new Map(rows.map((r) => [r.key, r.expiresAt.getTime()]));
  // Keys expiring before the next run are refreshed now, or reads would pay for them.
  const now = Date.now() + horizonSeconds * 1000;

  const due = jobs
    .filter((j) => (expiry.get(j.key) ?? 0) <= now)
    .sort((a, b) => (expiry.get(a.key) ?? 0) - (expiry.get(b.key) ?? 0));

  let refreshed = 0;
  let calls = 0;
  let rateLimited = false;
  for (const job of due) {
    if (calls >= budget || rateLimited) break;
    calls++;
    let failed = false;
    try {
      await getOrFetch(job.key, job.ttl, async () => {
        try {
          return await job.fetcher();
        } catch (error) {
          failed = true;
          if (error instanceof ApiFootballError && error.kind === "rate_limited") {
            rateLimited = true;
          }
          throw error;
        }
      }, { force: true });
    } catch (error) {
      if (!(error instanceof ApiFootballError)) throw error;
      failed = true;
    }
    if (!failed) refreshed++;
  }
  return { refreshed, skipped: jobs.length - refreshed };
}
