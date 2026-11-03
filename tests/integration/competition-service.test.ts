import { beforeEach, describe, expect, it, vi } from "vitest";
import leagues from "../fixtures/api-football/leagues-team.json";
import standingsLeague from "../fixtures/api-football/standings-league.json";
import standingsEmpty from "../fixtures/api-football/standings-cup-empty.json";
import standingsGroups from "../fixtures/api-football/standings-cup-groups.json";
import topscorers from "../fixtures/api-football/topscorers.json";
import topassistsEmpty from "../fixtures/api-football/topassists-empty.json";
import fixtures from "../fixtures/api-football/fixtures-team.json";

vi.mock("@/lib/env", () => ({ env: { SEASON_OVERRIDE: 2024, API_FOOTBALL_KEY: "k" } }));

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

import { prisma } from "@/lib/prisma";
import {
  getStandings,
  getTeamCompetitions,
  getTeamFixtures,
  getTopAssists,
  getTopScorers,
} from "@/modules/competitions/service";
import { ApiFootballError } from "@/server/api-football/client";

function respond(map: Record<string, unknown>) {
  apiGet.mockImplementation(async (path: string) => {
    const value = map[path];
    if (value instanceof Error) throw value;
    return value;
  });
}

async function seed() {
  const team = await prisma.team.create({
    data: { externalId: 127, name: "Flamengo", country: "Brazil" },
  });
  const competition = await prisma.competition.create({
    data: { externalId: 71, name: "Serie A", type: "League" },
  });
  return { team, competition };
}

beforeEach(() => apiGet.mockReset());

describe("getTeamCompetitions", () => {
  it("returns and persists competitions, seasons and team links", async () => {
    const { team } = await seed();
    respond({ "/leagues": leagues.response });
    const result = await getTeamCompetitions(team.id);
    expect(result.season).toBe(2024);
    expect(result.competitions.map((c) => [c.externalId, c.type])).toEqual([
      [71, "League"],
      [73, "Cup"],
    ]);
    expect(apiGet).toHaveBeenCalledWith("/leagues", { team: 127, season: 2024 });
    expect(await prisma.season.count()).toBe(2);
    expect(await prisma.teamCompetition.count()).toBe(2);
    await getTeamCompetitions(team.id); // cached + idempotent
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(await prisma.teamCompetition.count()).toBe(2);
  });
});

describe("getStandings", () => {
  it("returns a table for a league", async () => {
    const { competition } = await seed();
    respond({ "/standings": standingsLeague.response });
    const res = await getStandings(competition.id, 2024);
    expect(res.status).toBe("ok");
    if (res.status === "ok") expect(res.data.format).toBe("table");
  });
  it("is unavailable/no_coverage for an empty cup response", async () => {
    const { competition } = await seed();
    respond({ "/standings": standingsEmpty.response });
    expect(await getStandings(competition.id, 2024)).toEqual({
      status: "unavailable",
      reason: "no_coverage",
    });
  });
  it("returns stages (never a table) for multiple groups", async () => {
    const { competition } = await seed();
    respond({ "/standings": standingsGroups.response });
    const res = await getStandings(competition.id, 2024);
    expect(res.status === "ok" && res.data.format).toBe("stages");
  });
  it("is unavailable/provider_error on failure without cache", async () => {
    const { competition } = await seed();
    respond({ "/standings": new ApiFootballError("rate_limited", "429") });
    expect(await getStandings(competition.id, 2024)).toEqual({
      status: "unavailable",
      reason: "provider_error",
    });
  });
  it("serves expired cache as ok/stale on provider failure", async () => {
    const { competition } = await seed();
    respond({ "/standings": standingsLeague.response });
    await getStandings(competition.id, 2024);
    await prisma.apiCache.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    respond({ "/standings": new ApiFootballError("unavailable", "503") });
    const res = await getStandings(competition.id, 2024);
    expect(res.status).toBe("ok");
    if (res.status === "ok") expect(res.stale).toBe(true);
  });
  it("throws for an unknown competition id", async () => {
    await expect(getStandings("00000000-0000-4000-8000-000000000000", 2024)).rejects.toThrow();
  });
});

describe("top scorers and assists", () => {
  it("lists scorers", async () => {
    const { competition } = await seed();
    respond({ "/players/topscorers": topscorers.response });
    const res = await getTopScorers(competition.id, 2024);
    expect(res.status === "ok" && res.data[0].value).toBe(15);
  });
  it("empty assists is unavailable/no_coverage, never zero", async () => {
    const { competition } = await seed();
    respond({ "/players/topassists": topassistsEmpty.response });
    expect(await getTopAssists(competition.id, 2024)).toEqual({
      status: "unavailable",
      reason: "no_coverage",
    });
  });
});

describe("getTeamFixtures", () => {
  it("splits past and upcoming by date and status", async () => {
    const { team } = await seed();
    respond({ "/fixtures": fixtures.response });
    const res = await getTeamFixtures(team.id, 2024);
    expect(res.status).toBe("ok");
    if (res.status !== "ok") return;
    expect(res.data.past.map((f) => f.externalId)).toEqual([11, 10]);
    expect(res.data.upcoming.map((f) => f.externalId)).toEqual([12]);
    expect(res.data.upcoming[0].date).toBe("2030-01-01T22:00:00.000Z");
  });
  it("has empty upcoming when the club has no future match", async () => {
    const { team } = await seed();
    respond({ "/fixtures": fixtures.response.slice(0, 2) });
    const res = await getTeamFixtures(team.id, 2024);
    expect(res.status === "ok" && res.data.upcoming).toEqual([]);
  });
});
