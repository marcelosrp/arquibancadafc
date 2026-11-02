import { prisma } from "@/lib/prisma";

/**
 * Fixed-window counter in Postgres. The upsert is atomic, so concurrent
 * requests cannot undercount.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean }> {
  const windowMs = windowSec * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"`;
  return { allowed: rows[0].count <= limit };
}
