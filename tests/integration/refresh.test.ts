import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import standings from "../fixtures/api-football/standings-league.json";
import topscorers from "../fixtures/api-football/topscorers.json";
import topassists from "../fixtures/api-football/topassists-empty.json";
import fixtures from "../fixtures/api-football/fixtures-team.json";

vi.mock("@/lib/env", () => ({
  env: { SEASON_OVERRIDE: 2024, API_FOOTBALL_KEY: "k", CRON_SECRET: "cron-secret" },
}));

const apiGet = vi.hoisted(() => vi.fn());
vi.mock("@/server/api-football/client", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  ApiFootballError: class ApiFootballError extends Error {
    constructor(
      public kind: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { POST } from "@/app/api/internal/refresh/route";
import { prisma } from "@/lib/prisma";
import { refreshAll } from "@/modules/sync/refresh";
import { ApiFootballError } from "@/server/api-football/client";

const responses: Record<string, unknown> = {
  "/standings": standings.response,
  "/players/topscorers": topscorers.response,
  "/players/topassists": topassists.response,
  "/fixtures": fixtures.response,
};

async function seedClub(users: number) {
  const team = await prisma.team.create({
    data: { externalId: 127, name: "Flamengo", country: "Brazil" },
  });
  const competition = await prisma.competition.create({
    data: { externalId: 71, name: "Serie A", type: "League" },
  });
  const season = await prisma.season.create({ data: { competitionId: competition.id, year: 2024 } });
  await prisma.teamCompetition.create({ data: { teamId: team.id, seasonId: season.id } });
  await prisma.user.createMany({
    data: Array.from({ length: users }, (_, i) => ({
      name: `User ${i}`,
      email: `u${i}@x.com`,
      passwordHash: "x",
      favoriteTeamId: team.id,
    })),
  });
}

const request = (authorization?: string) =>
  new NextRequest("http://localhost/api/internal/refresh", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  apiGet.mockReset();
  apiGet.mockImplementation(async (path: string) => responses[path]);
});

describe("POST /api/internal/refresh", () => {
  it.each([undefined, "Bearer wrong"])("returns 401 and does nothing for %s", async (header) => {
    await seedClub(1);
    const res = await POST(request(header));
    expect(res.status).toBe(401);
    expect(apiGet).not.toHaveBeenCalled();
    expect(await prisma.apiCache.count()).toBe(0);
  });

  it("refreshes with the correct secret", async () => {
    await seedClub(1);
    const res = await POST(request("Bearer cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ refreshed: 4, skipped: 0 });
  });
});

describe("refreshAll", () => {
  it("makes the same calls for 50 users of one club as for 1", async () => {
    await seedClub(1);
    await refreshAll(60);
    const single = apiGet.mock.calls.length;

    await prisma.apiCache.deleteMany();
    apiGet.mockClear();
    await prisma.user.deleteMany();
    const team = await prisma.team.findFirstOrThrow();
    await prisma.user.createMany({
      data: Array.from({ length: 50 }, (_, i) => ({
        name: `User ${i}`,
        email: `fan${i}@x.com`,
        passwordHash: "x",
        favoriteTeamId: team.id,
      })),
    });
    await refreshAll(60);
    expect(single).toBe(4);
    expect(apiGet).toHaveBeenCalledTimes(single);
  });

  it("respects the budget", async () => {
    await seedClub(1);
    const result = await refreshAll(2);
    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(result.refreshed).toBe(2);
  });

  it("stops after rate_limited", async () => {
    await seedClub(1);
    apiGet.mockRejectedValue(new ApiFootballError("rate_limited", "429"));
    const result = await refreshAll(60);
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(result.refreshed).toBe(0);
  });

  it("skips keys that are still fresh", async () => {
    await seedClub(1);
    await refreshAll(60);
    apiGet.mockClear();
    const result = await refreshAll(60);
    expect(apiGet).not.toHaveBeenCalled();
    expect(result).toEqual({ refreshed: 0, skipped: 4 });
  });

  it("refreshes the oldest expired keys first", async () => {
    await seedClub(1);
    await refreshAll(60);
    const past = (h: number) => new Date(Date.now() - h * 3600_000);
    await prisma.apiCache.update({
      where: { key: "topscorers:71:2024" },
      data: { expiresAt: past(1) },
    });
    await prisma.apiCache.update({
      where: { key: "standings:71:2024" },
      data: { expiresAt: past(5) },
    });
    apiGet.mockClear();
    await refreshAll(1);
    expect(apiGet.mock.calls[0][0]).toBe("/standings");
  });
});
