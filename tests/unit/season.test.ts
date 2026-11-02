import { describe, expect, it } from "vitest";
import { resolveSeason } from "@/lib/season";

describe("resolveSeason", () => {
  it("returns the override, ignoring apiSeasons", () => {
    expect(
      resolveSeason({ override: 2024, apiSeasons: [{ year: 2026, current: true }] }),
    ).toBe(2024);
    expect(resolveSeason({ override: 2024, apiSeasons: [] })).toBe(2024);
  });

  it("returns the current season when there is no override", () => {
    expect(
      resolveSeason({
        apiSeasons: [
          { year: 2025, current: false },
          { year: 2026, current: true },
        ],
      }),
    ).toBe(2026);
  });

  it("uses the current flag even when it is not the highest year", () => {
    expect(
      resolveSeason({
        apiSeasons: [
          { year: 2026, current: false },
          { year: 2025, current: true },
        ],
      }),
    ).toBe(2025);
  });

  it("falls back to the highest year when none is current", () => {
    expect(
      resolveSeason({
        apiSeasons: [
          { year: 2022, current: false },
          { year: 2024, current: false },
          { year: 2023, current: false },
        ],
      }),
    ).toBe(2024);
  });

  it("throws season_unavailable for an empty list without override", () => {
    expect(() => resolveSeason({ apiSeasons: [] })).toThrow("season_unavailable");
  });
});
