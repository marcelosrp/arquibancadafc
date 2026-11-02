import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { ApiFootballError } from "@/server/api-football/client";
import { getOrFetch } from "@/server/cache/api-cache";

vi.mock("@/lib/env", () => ({ env: { API_FOOTBALL_KEY: "test-key" } }));

const TTL = 60;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

function advance(seconds: number) {
  vi.setSystemTime(new Date(Date.now() + seconds * 1000));
}

describe("getOrFetch", () => {
  it("fetches and stores on first call", async () => {
    const fetcher = vi.fn().mockResolvedValue({ n: 1 });
    const res = await getOrFetch("k", TTL, fetcher);
    expect(res.data).toEqual({ n: 1 });
    expect(res.stale).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const row = await prisma.apiCache.findUniqueOrThrow({ where: { key: "k" } });
    expect(row.expiresAt.getTime() - row.fetchedAt.getTime()).toBe(TTL * 1000);
  });

  it("serves from cache within the TTL", async () => {
    const fetcher = vi.fn().mockResolvedValue({ n: 1 });
    const first = await getOrFetch("k", TTL, fetcher);
    advance(TTL - 1);
    const second = await getOrFetch("k", TTL, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(second.data).toEqual({ n: 1 });
    expect(second.fetchedAt).toEqual(first.fetchedAt);
    expect(second.stale).toBe(false);
  });

  it("refetches after expiry", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ n: 1 }).mockResolvedValueOnce({ n: 2 });
    await getOrFetch("k", TTL, fetcher);
    advance(TTL + 1);
    const res = await getOrFetch("k", TTL, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({ n: 2 });
    expect(res.stale).toBe(false);
  });

  it.each(["rate_limited", "timeout", "unavailable"] as const)(
    "serves expired data as stale on %s",
    async (kind) => {
      const first = await getOrFetch("k", TTL, async () => ({ n: 1 }));
      advance(TTL + 1);
      const fetcher = vi.fn().mockRejectedValue(new ApiFootballError(kind, "boom"));
      const res = await getOrFetch("k", TTL, fetcher);
      expect(res.data).toEqual({ n: 1 });
      expect(res.stale).toBe(true);
      expect(res.fetchedAt).toEqual(first.fetchedAt);
      const row = await prisma.apiCache.findUniqueOrThrow({ where: { key: "k" } });
      expect(row.fetchedAt).toEqual(first.fetchedAt);
    },
  );

  it("propagates the error when nothing is stored", async () => {
    const err = new ApiFootballError("rate_limited", "boom");
    await expect(getOrFetch("k", TTL, async () => Promise.reject(err))).rejects.toBe(err);
  });

  it("propagates non-API errors even with expired data", async () => {
    await getOrFetch("k", TTL, async () => ({ n: 1 }));
    advance(TTL + 1);
    await expect(
      getOrFetch("k", TTL, async () => {
        throw new TypeError("bug");
      }),
    ).rejects.toThrow(TypeError);
  });

  it("deduplicates concurrent calls for the same key", async () => {
    const fetcher = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return { n: 1 };
    });
    const [a, b] = await Promise.all([
      getOrFetch("k", TTL, fetcher),
      getOrFetch("k", TTL, fetcher),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(a.data).toEqual(b.data);
  });

  it("keeps different keys independent", async () => {
    const a = await getOrFetch("a", TTL, async () => "A");
    const b = await getOrFetch("b", TTL, async () => "B");
    expect(a.data).toBe("A");
    expect(b.data).toBe("B");
  });
});
