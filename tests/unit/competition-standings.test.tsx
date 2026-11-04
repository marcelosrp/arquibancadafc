import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompetitionDetailView } from "@/components/competitions/CompetitionDetailView";
import { CompetitionStandings } from "@/components/competitions/CompetitionStandings";
import type { CompetitionDetail } from "@/modules/competitions/detail";
import { participantsFrom } from "@/modules/competitions/participants";
import type { Availability, Standings, StandingRow } from "@/modules/competitions/types";

const row = (id: number, name: string): StandingRow => ({
  rank: 1,
  teamExternalId: id,
  teamName: name,
  teamLogo: null,
  points: 10,
  played: 5,
  goalsDiff: 3,
});
function ok<T>(data: T): Availability<T> {
  return { status: "ok", data, fetchedAt: new Date("2024-05-01T12:00:00Z"), stale: false };
}
const stages = ok<Standings>({
  format: "stages",
  stages: [
    { name: "Group A", rows: [row(127, "Flamengo")] },
    { name: "Group B", rows: [row(126, "São Paulo")] },
  ],
});
const table = ok<Standings>({ format: "table", rows: [row(127, "Flamengo")] });

describe("CompetitionStandings", () => {
  it("renders stages for a cup", () => {
    const html = renderToStaticMarkup(<CompetitionStandings standings={stages} />);
    expect(html).toContain('data-testid="stages-view"');
    expect(html).toContain("Group A");
  });

  it("renders a table for a league", () => {
    const html = renderToStaticMarkup(<CompetitionStandings standings={table} />);
    expect(html).toContain('data-testid="standings-table"');
    expect(html).not.toContain("stages-view");
  });

  it("renders 'Dado indisponível' when unavailable", () => {
    const html = renderToStaticMarkup(
      <CompetitionStandings standings={{ status: "unavailable", reason: "no_coverage" }} />,
    );
    expect(html).toContain("Dado indisponível");
    expect(html).not.toContain("standings-table");
  });
});

describe("CompetitionDetailView", () => {
  const detail = (standings: Availability<Standings>): CompetitionDetail => ({
    competition: { id: "c", name: "Libertadores", type: "Cup" },
    season: 2024,
    favoriteTeamExternalId: 127,
    standings,
    topScorers: ok([]),
    topAssists: { status: "unavailable", reason: "no_coverage" },
    participants: participantsFrom(standings),
    fixtures: ok({ past: [], upcoming: [] }),
  });

  it("shows stages, season year, unavailable assists and no-next-match for a cup", () => {
    const html = renderToStaticMarkup(<CompetitionDetailView detail={detail(stages)} />);
    expect(html).toContain('data-testid="stages-view"');
    expect(html).toContain("Temporada 2024");
    expect(html).toContain("Dado indisponível");
    expect(html).toContain("Sem próxima partida");
    expect(html).toContain("Flamengo, São Paulo");
  });
});

describe("participantsFrom", () => {
  it("dedupes teams across stages", () => {
    const dup = ok<Standings>({
      format: "stages",
      stages: [
        { name: "A", rows: [row(1, "X")] },
        { name: "B", rows: [row(1, "X"), row(2, "Y")] },
      ],
    });
    const result = participantsFrom(dup);
    expect(result.status === "ok" && result.data.map((p) => p.teamExternalId)).toEqual([1, 2]);
  });
});
