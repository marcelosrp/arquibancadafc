export function Unavailable({ label = "Dado indisponível" }: { label?: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}
