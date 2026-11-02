import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "super-secret-api-key";

vi.mock("@/lib/env", () => ({
  env: {
    API_FOOTBALL_BASE_URL: "https://v3.football.api-sports.io",
    API_FOOTBALL_KEY: "super-secret-api-key",
  },
}));

const usageCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { apiUsage: { create: (...args: unknown[]) => usageCreate(...args) } },
}));

import { ApiFootballError, apiGet } from "@/server/api-football/client";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

const ok = (response: unknown, headers: Record<string, string> = {}) =>
  jsonResponse({ errors: [], response }, 200, headers);

/** Runs apiGet, flushes timers, and resolves with either value or the thrown error. */
async function settle<T>(promise: Promise<T>, advanceMs = 0) {
  const outcome = promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(advanceMs);
  return outcome;
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  usageCreate.mockReset();
  usageCreate.mockResolvedValue({});
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("apiGet", () => {
  it("sends the api key header, builds the query and returns `response`", async () => {
    fetchMock.mockResolvedValueOnce(ok([{ id: 1 }]));

    const result = await settle(apiGet("/teams", { country: "Brazil", season: 2024 }));

    expect(result).toEqual({ value: [{ id: 1 }] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://v3.football.api-sports.io/teams?country=Brazil&season=2024");
    expect(new Headers(init.headers).get("x-apisports-key")).toBe(KEY);
  });

  it("throws rate_limited on 429 without retrying", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 429));

    const result = await settle(apiGet("/teams", {}), 10_000);

    expect(result).toMatchObject({ error: expect.objectContaining({ kind: "rate_limited" }) });
    expect((result as { error: unknown }).error).toBeInstanceOf(ApiFootballError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries 503 up to 3 attempts with backoff, then throws unavailable", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}, 503));

    const result = await settle(apiGet("/teams", {}), 10_000);

    expect(result).toMatchObject({ error: expect.objectContaining({ kind: "unavailable" }) });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("waits for the backoff before retrying", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}, 503));

    const outcome = settle(apiGet("/teams", {}), 0);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(499);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await outcome;
  });

  it("returns data after a transient failure", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(ok([{ id: 7 }]));

    const result = await settle(apiGet("/teams", {}), 5_000);

    expect(result).toEqual({ value: [{ id: 7 }] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries network errors", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(ok([]));

    const result = await settle(apiGet("/teams", {}), 5_000);

    expect(result).toEqual({ value: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws timeout after 8s", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    const result = await settle(apiGet("/teams", {}), 8_000);

    expect(result).toMatchObject({ error: expect.objectContaining({ kind: "timeout" }) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws bad_response when a 200 body carries an errors object", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: { plan: "Free plans do not have access to this season" }, response: [] }),
    );

    const result = await settle(apiGet("/standings", { season: 2026 }));

    expect(result).toMatchObject({
      error: expect.objectContaining({
        kind: "bad_response",
        message: expect.stringContaining("Free plans do not have access to this season"),
      }),
    });
  });

  it("throws bad_response when errors is a non-empty array", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: ["Bad parameter"], response: [] }));

    const result = await settle(apiGet("/teams", {}));

    expect(result).toMatchObject({
      error: expect.objectContaining({
        kind: "bad_response",
        message: expect.stringContaining("Bad parameter"),
      }),
    });
  });

  it("throws bad_response on non-JSON or missing response", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("<html>", { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ errors: [] }));

    const a = await settle(apiGet("/teams", {}));
    const b = await settle(apiGet("/teams", {}));

    expect(a).toMatchObject({ error: expect.objectContaining({ kind: "bad_response" }) });
    expect(b).toMatchObject({ error: expect.objectContaining({ kind: "bad_response" }) });
  });

  it("never exposes the api key in error messages", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ errors: { token: `invalid key ${KEY}` }, response: [] }))
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockImplementation(async () => jsonResponse({}, 503));

    const results = [
      await settle(apiGet("/teams", {})),
      await settle(apiGet("/teams", {})),
      await settle(apiGet("/teams", {}), 10_000),
    ];

    for (const r of results) {
      const message = (r as { error: Error }).error.message;
      expect(message).not.toContain(KEY);
    }
  });

  it("logs ApiUsage for each attempt with remaining quota", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 503, { "x-ratelimit-requests-remaining": "42" }))
      .mockResolvedValueOnce(ok([]));

    await settle(apiGet("/fixtures", { team: 1 }), 5_000);

    expect(usageCreate).toHaveBeenCalledTimes(2);
    expect(usageCreate).toHaveBeenNthCalledWith(1, {
      data: { endpoint: "/fixtures", status: 503, remainingDay: 42 },
    });
    expect(usageCreate).toHaveBeenNthCalledWith(2, {
      data: { endpoint: "/fixtures", status: 200, remainingDay: null },
    });
  });

  it("still returns data when logging usage fails", async () => {
    usageCreate.mockRejectedValue(new Error("db down"));
    fetchMock.mockResolvedValueOnce(ok([{ id: 1 }]));

    const result = await settle(apiGet("/teams", {}));

    expect(result).toEqual({ value: [{ id: 1 }] });
  });
});
