import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/server/rate-limit";

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows up to the limit and blocks the next call", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await rateLimit("login:ip", 5, 60)).allowed).toBe(true);
    }
    expect((await rateLimit("login:ip", 5, 60)).allowed).toBe(false);
  });

  it("keeps keys independent", async () => {
    for (let i = 0; i < 6; i++) await rateLimit("a", 5, 60);
    expect((await rateLimit("b", 5, 60)).allowed).toBe(true);
  });

  it("allows again in a new window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    for (let i = 0; i < 6; i++) await rateLimit("w", 5, 60);
    vi.setSystemTime(new Date("2026-01-01T00:01:01Z"));
    expect((await rateLimit("w", 5, 60)).allowed).toBe(true);
  });
});
