import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import leagues from "../fixtures/api-football/leagues-team.json";
import standingsLeague from "../fixtures/api-football/standings-league.json";
import standingsGroups from "../fixtures/api-football/standings-cup-groups.json";
import topscorers from "../fixtures/api-football/topscorers.json";
import topassistsEmpty from "../fixtures/api-football/topassists-empty.json";
import fixtures from "../fixtures/api-football/fixtures-team.json";

vi.mock("@/lib/env", () => ({
  env: { SEASON_OVERRIDE: 2024, API_FOOTBALL_KEY: "k" },
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

const currentUser = vi.hoisted(() => ({ value: null as { id: string } | null }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => currentUser.value,
}));

import { GET as getStandings } from "@/app/api/competitions/[id]/standings/route";
import { GET as getTopScorers } from "@/app/api/competitions/[id]/top-scorers/route";
import { GET as getTopAssists } from "@/app/api/competitions/[id]/top-assists/route";
import { GET as getTeamCompetitions } from "@/app/api/teams/[teamId]/competitions/route";
import { GET as getTeamFixtures } from "@/app/api/teams/[teamId]/fixtures/route";
import { prisma } from "@/lib/prisma";

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

function call(
  handler: (req: NextRequest, ctx: { params: Promise<never> }) => Promise<Response>,
  params: Record<string, string>,
  query = "",
) {
  const req = new NextRequest(`http://localhost/api/x${query}`);
  return handler(req, { params: Promise.resolve(params) as Promise<never> });
}

async function seed() {
  const team = await prisma.team.create({
    data: { externalId: 127, name: "Flamengo", country: "Brazil" },
  });
  const user = await prisma.user.create({
    data: { name: "Fla", email: "fla@x.com", passwordHash: "x", favoriteTeamId: team.id },
  });
  const league = await prisma.competition.create({
    data: { externalId: 71, name: "Serie A", type: "League" },
  });
  const cup = await prisma.competition.create({
    data: { externalId: 13, name: "Libertadores", type: "Cup" },
  });
  return { team, user, league, cup };
}

function respond(overrides: Record<string, unknown> = {}) {
  const map: Record<string, unknown> = {
    "/leagues": leagues.response,
    "/standings": standingsLeague.response,
    "/players/topscorers": topscorers.response,
    "/players/topassists": topassistsEmpty.response,
    "/fixtures": fixtures.response,
    ...overrides,
  };
  apiGet.mockImplementation(async (path: string) => map[path]);
}

beforeEach(() => {
  apiGet.mockReset();
  currentUser.value = null;
});

const competitionRoutes = [
  ["standings", getStandings],
  ["top-scorers", getTopScorers],
  ["top-assists", getTopAssists],
] as const;

const teamRoutes = [
  ["competitions", getTeamCompetitions],
  ["fixtures", getTeamFixtures],
] as const;

describe.each(competitionRoutes)("GET /api/competitions/:id/%s", (_name, handler) => {
  it("returns 401 without a session and makes no external call", async () => {
    const { league } = await seed();
    respond();
    const res = await call(handler, { id: league.id });
    expect(res.status).toBe(401);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown or malformed id", async () => {
    const { user } = await seed();
    currentUser.value = { id: user.id };
    respond();
    expect((await call(handler, { id: UNKNOWN_ID })).status).toBe(404);
    expect((await call(handler, { id: "not-a-uuid" })).status).toBe(404);
  });

  it("returns 400 for an invalid season", async () => {
    const { user, league } = await seed();
    currentUser.value = { id: user.id };
    respond();
    const res = await call(handler, { id: league.id }, "?season=abc");
    expect(res.status).toBe(400);
  });
});

describe.each(teamRoutes)("GET /api/teams/:teamId/%s", (_name, handler) => {
  it("returns 401 without a session and makes no external call", async () => {
    const { team } = await seed();
    respond();
    const res = await call(handler, { teamId: team.id });
    expect(res.status).toBe(401);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown or malformed id", async () => {
    const { user } = await seed();
    currentUser.value = { id: user.id };
    respond();
    expect((await call(handler, { teamId: UNKNOWN_ID })).status).toBe(404);
    expect((await call(handler, { teamId: "not-a-uuid" })).status).toBe(404);
  });
});

describe("competition data", () => {
  it("returns a table for a league", async () => {
    const { user, league } = await seed();
    currentUser.value = { id: user.id };
    respond();
    const body = await (await call(getStandings, { id: league.id })).json();
    expect(body.status).toBe("ok");
    expect(body.data.format).toBe("table");
  });

  it("returns stages for a cup with groups", async () => {
    const { user, cup } = await seed();
    currentUser.value = { id: user.id };
    respond({ "/standings": standingsGroups.response });
    const body = await (await call(getStandings, { id: cup.id })).json();
    expect(body.status).toBe("ok");
    expect(body.data.format).toBe("stages");
  });

  it("returns top scorers", async () => {
    const { user, league } = await seed();
    currentUser.value = { id: user.id };
    respond();
    const body = await (await call(getTopScorers, { id: league.id })).json();
    expect(body.status).toBe("ok");
    expect(body.data[0].name).toBe("G. Gómez");
  });

  it("reports unavailable (not zero) for assists without coverage", async () => {
    const { user, league } = await seed();
    currentUser.value = { id: user.id };
    respond();
    const res = await call(getTopAssists, { id: league.id });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "unavailable", reason: "no_coverage" });
  });
});

describe("team data", () => {
  it("lists the team's competitions for the season", async () => {
    const { user, team } = await seed();
    currentUser.value = { id: user.id };
    respond();
    const body = await (await call(getTeamCompetitions, { teamId: team.id })).json();
    expect(body.season).toBe(2024);
    expect(body.competitions.map((c: { name: string }) => c.name)).toEqual([
      "Serie A",
      "Copa Do Brasil",
    ]);
  });

  it("splits fixtures into past and upcoming with the competition id", async () => {
    const { user, team } = await seed();
    currentUser.value = { id: user.id };
    respond();
    const body = await (await call(getTeamFixtures, { teamId: team.id })).json();
    expect(body.status).toBe("ok");
    expect(body.data.past).toHaveLength(2);
    expect(body.data.upcoming).toHaveLength(1);
    expect(body.data.upcoming[0].competitionExternalId).toBe(71);
  });
});
