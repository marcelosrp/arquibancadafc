export function Unavailable({ label = "Dado indisponível" }: { label?: string }) {
  return (
    <p className="inline-flex w-fit items-center rounded-md border border-dashed bg-muted px-2 py-1 text-sm font-medium text-foreground/80">
      {label}
    </p>
  );
}
