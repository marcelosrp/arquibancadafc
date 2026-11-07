import { TeamLogo } from "@/components/shared/TeamLogo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { StandingRow } from "@/modules/competitions/types";

const ZONE_SIZE = 4;
export const MIN_ROWS_FOR_ZONES = 12;

type Zone = "top" | "bottom" | null;

function zoneOf(index: number, total: number, enabled: boolean): Zone {
  if (!enabled) return null;
  if (index < ZONE_SIZE) return "top";
  if (index >= total - ZONE_SIZE) return "bottom";
  return null;
}

const ZONE_BAR = {
  top: "shadow-[inset_3px_0_0_var(--primary)]",
  bottom: "shadow-[inset_3px_0_0_var(--destructive)]",
} as const;
const ZONE_LABEL = {
  top: "Zona de classificação (G4)",
  bottom: "Zona de rebaixamento (Z4)",
} as const;

export function StandingsTable({
  rows,
  highlightTeamExternalId,
  showZones = false,
}: {
  rows: StandingRow[];
  highlightTeamExternalId?: number;
  showZones?: boolean;
}) {
  const zones = showZones && rows.length >= MIN_ROWS_FOR_ZONES;
  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <Table data-testid="standings-table" className="tabular-nums">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Clube</TableHead>
            <TableHead className="text-right">J</TableHead>
            <TableHead className="text-right">SG</TableHead>
            <TableHead className="text-right">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const zone = zoneOf(index, rows.length, zones);
            const mine = row.teamExternalId === highlightTeamExternalId;
            return (
              <TableRow
                key={row.teamExternalId}
                className={cn(mine && "bg-primary/10 font-semibold")}
              >
                <TableCell
                  className={cn(
                    "text-center font-heading text-base font-bold",
                    zone && ZONE_BAR[zone],
                    zone === "top" && "text-primary",
                    zone === "bottom" && "text-destructive",
                  )}
                >
                  {row.rank}
                  {zone && <span className="sr-only"> — {ZONE_LABEL[zone]}</span>}
                </TableCell>
                <TableCell>
                  <span className="flex min-w-32 items-center gap-2">
                    <TeamLogo name={row.teamName} src={row.teamLogo} size={20} />
                    <span>{row.teamName}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right">{row.played}</TableCell>
                <TableCell className="text-right">{row.goalsDiff}</TableCell>
                <TableCell className="text-right font-bold">{row.points}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function ZoneLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-primary" />
        Classificação (G4)
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-sm bg-destructive" />
        Rebaixamento (Z4)
      </li>
    </ul>
  );
}
