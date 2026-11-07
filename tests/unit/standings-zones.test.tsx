import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StandingsTable } from "@/components/competitions/StandingsTable";
import type { StandingRow } from "@/modules/competitions/types";

const rows = (n: number): StandingRow[] =>
  Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    teamExternalId: i + 1,
    teamName: `Time ${i + 1}`,
    teamLogo: null,
    points: 30 - i,
    played: 10,
    goalsDiff: 0,
  }));

const TOP = "— entre os 4 primeiros";
const BOTTOM = "— entre os 4 últimos";

describe("StandingsTable zones", () => {
  it("marks rows 1-4 and 9-12 of a 12-row league only", () => {
    const html = renderToStaticMarkup(<StandingsTable rows={rows(12)} showZones />);
    const trs = html.split("<tr").slice(2); // skip header
    expect(trs).toHaveLength(12);
    trs.forEach((tr, i) => {
      expect(tr.includes(TOP)).toBe(i < 4);
      expect(tr.includes(BOTTOM)).toBe(i >= 8);
    });
  });

  it("shows no zone text with fewer than 12 rows", () => {
    const html = renderToStaticMarkup(<StandingsTable rows={rows(11)} showZones />);
    expect(html).not.toContain("entre os 4");
  });
});
