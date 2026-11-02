import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/api-football/teams-brazil.json";

vi.mock("@/lib/env", () => ({
  env: { SEASON_OVERRIDE: 2024, CRON_SECRET: "cron-secret" },
}));
vi.mock("@/server/api-football/client", () => ({
  apiGet: vi.fn(async () => fixture.response),
  ApiFootballError: class ApiFootballError extends Error {
    constructor(
      public kind: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { GET } from "@/app/api/teams/route";
import { POST } from "@/app/api/internal/sync-teams/route";
import { prisma } from "@/lib/prisma";
import { searchTeams } from "@/modules/teams/search";
import { syncTeams } from "@/modules/teams/sync";

afterEach(() => vi.restoreAllMocks());

describe("syncTeams", () => {
  it("is idempotent", async () => {
    await syncTeams();
    const first = await prisma.team.count();
    await syncTeams();
    expect(await prisma.team.count()).toBe(first);
    expect(first).toBe(3);
  });
});

describe("searchTeams", () => {
  it("matches ignoring case and accents", async () => {
    await syncTeams();
    expect((await searchTeams("flam")).map((t) => t.name)).toEqual(["Flamengo"]);
    expect((await searchTeams("sao paulo")).map((t) => t.name)).toEqual(["São Paulo"]);
  });

  it("returns [] for queries shorter than 2 characters", async () => {
    await syncTeams();
    expect(await searchTeams("f")).toEqual([]);
  });

  it("treats LIKE wildcards literally", async () => {
    await syncTeams();
    expect(await searchTeams("%%")).toEqual([]);
    expect(await searchTeams("__")).toEqual([]);
  });
});

describe("GET /api/teams", () => {
  it("answers from the database without calling external fetch", async () => {
    await syncTeams();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await GET(new NextRequest("http://x/api/teams?search=fla"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.teams.map((t: { name: string }) => t.name)).toEqual(["Flamengo"]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("POST /api/internal/sync-teams", () => {
  it("rejects a missing or wrong secret with 401 and no writes", async () => {
    const bad = await POST(new NextRequest("http://x/api/internal/sync-teams", { method: "POST" }));
    const wrong = await POST(
      new NextRequest("http://x/api/internal/sync-teams", {
        method: "POST",
        headers: { authorization: "Bearer nope" },
      }),
    );
    expect(bad.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(await prisma.team.count()).toBe(0);
  });

  it("syncs with the right secret", async () => {
    const res = await POST(
      new NextRequest("http://x/api/internal/sync-teams", {
        method: "POST",
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    expect(res.status).toBe(200);
    expect(await prisma.team.count()).toBe(3);
  });
});
