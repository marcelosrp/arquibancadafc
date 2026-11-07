import { TeamLogo } from "@/components/shared/TeamLogo";
import { Badge } from "@/components/ui/badge";

export function ClubHeader({
  name,
  logo,
  season,
}: {
  name: string;
  logo: string | null;
  season: number;
}) {
  return (
    <header className="flex min-w-0 items-center gap-4 rounded-xl border bg-card p-4 sm:gap-6 sm:p-6">
      <TeamLogo name={name} src={logo} size={96} className="size-16 sm:size-24" />
      <div className="flex min-w-0 flex-col items-start gap-2">
        <h1 className="max-w-full truncate font-heading text-3xl font-bold uppercase tracking-wide sm:text-5xl">
          {name}
        </h1>
        <Badge variant="secondary">Temporada {season}</Badge>
      </div>
    </header>
  );
}
