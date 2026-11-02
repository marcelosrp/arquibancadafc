import { prisma } from "@/lib/prisma";
import { fetchBrazilianTeams } from "@/server/api-football/teams";

export async function syncTeams(): Promise<{ upserted: number }> {
  const teams = await fetchBrazilianTeams();
  await prisma.$transaction(
    teams.map((t) =>
      prisma.team.upsert({
        where: { externalId: t.externalId },
        create: t,
        update: { name: t.name, logo: t.logo, country: t.country },
      }),
    ),
  );
  return { upserted: teams.length };
}
