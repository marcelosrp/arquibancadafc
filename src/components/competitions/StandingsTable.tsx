import type { StandingRow } from "@/modules/competitions/types";

export function StandingsTable({
  rows,
  highlightTeamExternalId,
}: {
  rows: StandingRow[];
  highlightTeamExternalId?: number;
}) {
  return (
    <table data-testid="standings-table" className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="py-1 pr-2">#</th>
          <th className="py-1">Clube</th>
          <th className="py-1 text-right">J</th>
          <th className="py-1 text-right">SG</th>
          <th className="py-1 text-right">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.teamExternalId}
            className={row.teamExternalId === highlightTeamExternalId ? "font-semibold" : undefined}
          >
            <td className="py-1 pr-2">{row.rank}</td>
            <td className="py-1">
              <span className="flex items-center gap-2">
                {row.teamLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.teamLogo} alt="" width={20} height={20} />
                )}
                {row.teamName}
              </span>
            </td>
            <td className="py-1 text-right">{row.played}</td>
            <td className="py-1 text-right">{row.goalsDiff}</td>
            <td className="py-1 text-right">{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
