import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const validRaw = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/arquibancada",
  API_FOOTBALL_KEY: "super-secret-api-key",
  AUTH_SECRET: "super-secret-auth",
  CRON_SECRET: "super-secret-cron",
};

describe("parseEnv", () => {
  it("throws mentioning DATABASE_URL when it is missing", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("defaults API_FOOTBALL_BASE_URL when omitted", () => {
    const env = parseEnv(validRaw);
    expect(env.API_FOOTBALL_BASE_URL).toBe("https://v3.football.api-sports.io");
  });

  it("coerces SEASON_OVERRIDE to a number", () => {
    const env = parseEnv({ ...validRaw, SEASON_OVERRIDE: "2024" });
    expect(env.SEASON_OVERRIDE).toBe(2024);
  });

  it("leaves SEASON_OVERRIDE undefined when absent or empty", () => {
    expect(parseEnv(validRaw).SEASON_OVERRIDE).toBeUndefined();
    expect(parseEnv({ ...validRaw, SEASON_OVERRIDE: "" }).SEASON_OVERRIDE).toBeUndefined();
  });

  it("rejects a non-numeric SEASON_OVERRIDE", () => {
    expect(() => parseEnv({ ...validRaw, SEASON_OVERRIDE: "abc" })).toThrow(/SEASON_OVERRIDE/);
  });

  it("never leaks secret values in the error message", () => {
    let message = "";
    try {
      parseEnv({ ...validRaw, DATABASE_URL: undefined, SEASON_OVERRIDE: "abc" });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).not.toBe("");
    for (const secret of [validRaw.API_FOOTBALL_KEY, validRaw.AUTH_SECRET, validRaw.CRON_SECRET]) {
      expect(message).not.toContain(secret);
    }
  });
});
