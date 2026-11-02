import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiFootballError } from "@/server/api-football/client";

export type Cached<T> = { data: T; fetchedAt: Date; stale: boolean };

const inflight = new Map<string, Promise<Cached<unknown>>>();

async function load<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<Cached<T>> {
  const row = await prisma.apiCache.findUnique({ where: { key } });
  const now = new Date();
  if (row && row.expiresAt > now) {
    return { data: row.payload as T, fetchedAt: row.fetchedAt, stale: false };
  }

  try {
    const data = await fetcher();
    const fetchedAt = new Date();
    const expiresAt = new Date(fetchedAt.getTime() + ttlSeconds * 1000);
    const payload = data as Prisma.InputJsonValue;
    await prisma.apiCache.upsert({
      where: { key },
      create: { key, payload, fetchedAt, expiresAt },
      update: { payload, fetchedAt, expiresAt },
    });
    return { data, fetchedAt, stale: false };
  } catch (error) {
    if (row && error instanceof ApiFootballError) {
      return { data: row.payload as T, fetchedAt: row.fetchedAt, stale: true };
    }
    throw error;
  }
}

/**
 * Returns cached data while fresh; otherwise calls `fetcher` and stores the
 * result. If the provider fails (ApiFootballError) and an expired copy exists,
 * that copy is served with `stale: true`. Expired rows are never deleted — they
 * are the fallback. The payload must be JSON-serializable (dates as ISO strings).
 * Concurrent calls with the same key share one in-flight fetch (per process).
 */
export function getOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<Cached<T>> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<Cached<T>>;
  const promise = load(key, ttlSeconds, fetcher).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
