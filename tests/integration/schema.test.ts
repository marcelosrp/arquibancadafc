import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

async function createTeam(externalId = 1) {
  return prisma.team.create({
    data: { externalId, name: `Team ${externalId}`, country: "Brazil" },
  });
}

describe("schema constraints", () => {
  it("rejects a duplicate user email", async () => {
    const team = await createTeam();
    const data = {
      name: "Ana",
      email: "ana@example.com",
      passwordHash: "hash",
      favoriteTeamId: team.id,
    };
    await prisma.user.create({ data });
    await expect(prisma.user.create({ data })).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("rejects a duplicate season for the same competition and year", async () => {
    const competition = await prisma.competition.create({
      data: { externalId: 71, name: "Serie A" },
    });
    const data = { competitionId: competition.id, year: 2024 };
    await prisma.season.create({ data });
    await expect(prisma.season.create({ data })).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("rejects a team with a duplicate externalId", async () => {
    await createTeam(121);
    await expect(createTeam(121)).rejects.toMatchObject({ code: "P2002" });
  });
});
