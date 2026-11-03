const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function LastUpdated({ fetchedAt, stale }: { fetchedAt: Date; stale: boolean }) {
  return (
    <p className="text-xs text-muted-foreground">
      Atualizado em {formatter.format(fetchedAt)}
      {stale && <span className="ml-2 font-medium text-amber-600">Dados desatualizados</span>}
    </p>
  );
}
