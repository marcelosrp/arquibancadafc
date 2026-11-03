import { beforeEach, describe, expect, it, vi } from "vitest";
import leagues from "../fixtures/api-football/leagues-team.json";
import standingsLeague from "../fixtures/api-football/standings-league.json";
import standingsEmpty from "../fixtures/api-football/standings-cup-empty.json";
import topscorers from "../fixtures/api-football/topscorers.json";
import topassistsEmpty from "../fixtures/api-football/topassists-empty.json";
import fixtures from "../fixtures/api-football/fixtures-team.json";

const seasonOverride = vi.hoisted(() => ({ value: 2024 as number | undefined }));
vi.mock("@/lib/env", () => ({
  env: {
    get SEASON_OVERRIDE() {
      return seasonOverride.value;
    },
    API_FOOTBALL_KEY: "k",
  },
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

import { GET } from "@/app/api/dashboard/route";
import { prisma } from "@/lib/prisma";
import { getDashboard } from "@/modules/dashboard/service";

async function seedUser(teamExternalId: number, teamName: string, email: string) {
  const team = await prisma.team.create({
    data: { externalId: teamExternalId, name: teamName, country: "Brazil" },
  });
  return prisma.user.create({
    data: { name: teamName, email, passwordHash: "x", favoriteTeamId: team.id },
  });
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
  seasonOverride.value = 2024;
  currentUser.value = null;
});

describe("getDashboard", () => {
  it("shows only the user's own club", async () => {
    const flamengo = await seedUser(127, "Flamengo", "fla@x.com");
    const palmeiras = await seedUser(121, "Palmeiras", "pal@x.com");
    respond();
    expect((await getDashboard(flamengo.id)).team.name).toBe("Flamengo");
    expect((await getDashboard(palmeiras.id)).team.name).toBe("Palmeiras");
  });

  it("keeps standing and top scorer when assists are unavailable", async () => {
    const user = await seedUser(127, "Flamengo", "fla@x.com");
    respond();
    const dashboard = await getDashboard(user.id);
    const league = dashboard.competitions[0];
    expect(league.standing.status).toBe("ok");
    expect(league.topScorer.status).toBe("ok");
    expect(league.topAssist).toEqual({ status: "unavailable", reason: "no_coverage" });
  });

  it("marks a competition without standings as unavailable, not as a table", async () => {
    const user = await seedUser(127, "Flamengo", "fla@x.com");
    respond({ "/standings": standingsEmpty.response });
    const dashboard = await getDashboard(user.id);
    expect(dashboard.competitions[0].standing.status).toBe("unavailable");
  });

  it("has nextMatch.data === null when there is no upcoming fixture", async () => {
    const user = await seedUser(127, "Flamengo", "fla@x.com");
    const pastOnly = fixtures.response.filter((f) => f.fixture.status.short !== "NS");
    expect(pastOnly.length).toBeGreaterThan(0);
    respond({ "/fixtures": pastOnly });
    const { nextMatch } = await getDashboard(user.id);
    expect(nextMatch.status).toBe("ok");
    if (nextMatch.status === "ok") expect(nextMatch.data).toBeNull();
  });

  it("reflects SEASON_OVERRIDE", async () => {
    const user = await seedUser(127, "Flamengo", "fla@x.com");
    respond();
    expect((await getDashboard(user.id)).season).toBe(2024);
  });
});

describe("GET /api/dashboard", () => {
  it("returns 401 without a session and makes no external call", async () => {
    respond();
    const res = await GET();
    expect(res.status).toBe(401);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("returns the dashboard for the signed-in user", async () => {
    const user = await seedUser(127, "Flamengo", "fla@x.com");
    currentUser.value = { id: user.id };
    respond();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.team.name).toBe("Flamengo");
    expect(body.season).toBe(2024);
  });
});
