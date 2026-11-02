import { prisma } from "@/lib/prisma";
import type { TeamDTO } from "@/server/api-football/teams";

export type TeamSearchResult = TeamDTO & { id: string };

const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

/** Database-only search, case- and accent-insensitive. */
export async function searchTeams(q: string, limit = 10): Promise<TeamSearchResult[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const take = Math.min(Math.max(Math.trunc(limit) || 10, 1), 20);
  const pattern = `%${escapeLike(term)}%`;
  return prisma.$queryRaw<TeamSearchResult[]>`
    SELECT id, "externalId", name, logo, country
    FROM "Team"
    WHERE unaccent(name) ILIKE unaccent(${pattern})
    ORDER BY name
    LIMIT ${take}`;
}
