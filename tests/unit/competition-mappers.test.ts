import { describe, expect, it, vi } from "vitest";
import leagues from "../fixtures/api-football/leagues-team.json";
import standingsLeague from "../fixtures/api-football/standings-league.json";
import standingsEmpty from "../fixtures/api-football/standings-cup-empty.json";
import standingsGroups from "../fixtures/api-football/standings-cup-groups.json";
import topscorers from "../fixtures/api-football/topscorers.json";
import topassistsEmpty from "../fixtures/api-football/topassists-empty.json";
import fixtures from "../fixtures/api-football/fixtures-team.json";

vi.mock("@/lib/env", () => ({ env: { API_FOOTBALL_KEY: "k" } }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { mapFixtures, parseFixtures } from "@/server/api-football/fixtures";
import { mapLeagues, parseLeagues } from "@/server/api-football/leagues";
import { mapPlayers, parsePlayers } from "@/server/api-football/players";
import { mapStandings, parseStandings } from "@/server/api-football/standings";

describe("mapLeagues", () => {
  it("maps competitions with their season", () => {
    const result = mapLeagues(parseLeagues(leagues.response));
    expect(result).toEqual([
      { externalId: 71, name: "Serie A", type: "League", country: "Brazil", season: { year: 2024, startDate: "2024-04-13", endDate: "2024-12-08", current: false } },
      { externalId: 73, name: "Copa Do Brasil", type: "Cup", country: "Brazil", season: { year: 2024, startDate: "2024-02-20", endDate: "2024-11-06", current: false } },
    ]);
  });
  it("rejects unknown shapes as bad_response", () => {
    expect(() => parseLeagues([{ nope: 1 }])).toThrow(expect.objectContaining({ kind: "bad_response" }));
  });
});

describe("mapStandings", () => {
  it("returns a table for a single group", () => {
    const result = mapStandings(parseStandings(standingsLeague.response));
    expect(result).toEqual({
      format: "table",
      rows: [
        { rank: 1, teamExternalId: 127, teamName: "Flamengo", teamLogo: "https://media.api-sports.io/football/teams/127.png", points: 70, played: 38, goalsDiff: 30 },
        { rank: 2, teamExternalId: 126, teamName: "São Paulo", teamLogo: null, points: 65, played: 38, goalsDiff: 12 },
      ],
    });
  });
  it("returns null for an empty cup response", () => {
    expect(mapStandings(parseStandings(standingsEmpty.response))).toBeNull();
  });
  it("returns stages when there are several groups", () => {
    const result = mapStandings(parseStandings(standingsGroups.response));
    expect(result?.format).toBe("stages");
    if (result?.format !== "stages") return;
    expect(result.stages.map((s) => s.name)).toEqual(["Group A", "Group B"]);
  });
});

describe("mapPlayers", () => {
  it("ranks scorers by goals and drops entries without a value", () => {
    const result = mapPlayers(parsePlayers(topscorers.response), "goals");
    expect(result).toEqual([
      { playerExternalId: 1, name: "G. Gómez", photo: "https://media.api-sports.io/football/players/1.png", team: "Flamengo", value: 15 },
    ]);
  });
  it("returns an empty list for an empty response (never zero entries)", () => {
    expect(mapPlayers(parsePlayers(topassistsEmpty.response), "assists")).toEqual([]);
  });
});

describe("mapFixtures", () => {
  it("keeps ISO UTC dates and null scores", () => {
    const result = mapFixtures(parseFixtures(fixtures.response));
    expect(result[2]).toEqual({
      externalId: 12,
      date: "2030-01-01T22:00:00.000Z",
      status: "NS",
      competition: "Serie A",
      home: { name: "Flamengo", logo: "l.png", score: null },
      away: { name: "São Paulo", logo: null, score: null },
    });
  });
});
