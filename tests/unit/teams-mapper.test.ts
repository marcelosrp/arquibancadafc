import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/api-football/teams-brazil.json";

const envMock = vi.hoisted(() => ({ SEASON_OVERRIDE: 2024 as number | undefined }));
vi.mock("@/lib/env", () => ({ env: envMock }));

const apiGet = vi.fn();
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

import { fetchBrazilianTeams, mapTeam, parseTeams } from "@/server/api-football/teams";

beforeEach(() => {
  apiGet.mockReset();
  envMock.SEASON_OVERRIDE = 2024;
});

describe("mapTeam", () => {
  it("maps the fixture to TeamDTO", () => {
    const [flamengo] = parseTeams(fixture.response);
    expect(mapTeam(flamengo)).toEqual({
      externalId: 127,
      name: "Flamengo",
      logo: "https://media.api-sports.io/football/teams/127.png",
      country: "Brazil",
    });
  });

  it("turns a missing logo into null", () => {
    const teams = parseTeams(fixture.response).map(mapTeam);
    expect(teams.find((t) => t.externalId === 9999)?.logo).toBeNull();
  });

  it("rejects a malformed item as bad_response", () => {
    expect(() => parseTeams([{ team: { name: "x" } }])).toThrowError(
      expect.objectContaining({ kind: "bad_response" }),
    );
  });
});

describe("fetchBrazilianTeams", () => {
  it("dedupes, drops national teams and skips /leagues when SEASON_OVERRIDE is set", async () => {
    apiGet.mockResolvedValue(fixture.response);
    const teams = await fetchBrazilianTeams();

    expect(teams.map((t) => t.externalId).sort((a, b) => a - b)).toEqual([126, 127, 9999]);
    const paths = apiGet.mock.calls.map((c) => c[0]);
    expect(paths).not.toContain("/leagues");
    expect(paths.filter((p) => p === "/teams")).toHaveLength(4);
    expect(apiGet).toHaveBeenCalledWith("/teams", { league: 71, season: 2024 });
  });

  it("resolves the season from /leagues without an override", async () => {
    envMock.SEASON_OVERRIDE = undefined;
    apiGet.mockImplementation(async (path: string) =>
      path === "/leagues"
        ? [{ seasons: [{ year: 2026, current: true }] }]
        : fixture.response,
    );
    await fetchBrazilianTeams();
    expect(apiGet).toHaveBeenCalledWith("/leagues", { id: 71 });
    expect(apiGet).toHaveBeenCalledWith("/teams", { league: 72, season: 2026 });
  });
});
