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
    <header className="flex items-center gap-4">
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={`Escudo do ${name}`} width={64} height={64} className="size-16" />
      )}
      <div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-sm text-muted-foreground">Temporada {season}</p>
      </div>
    </header>
  );
}
