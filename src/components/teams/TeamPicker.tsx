"use client";

import { useCallback, useRef, useState } from "react";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string; logo: string | null };
type State = "idle" | "loading" | "done" | "error";

const DEBOUNCE_MS = 300;

export function TeamPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (teamId: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [state, setState] = useState<State>("idle");
  const [selected, setSelected] = useState<Team | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);

  function cancelPending() {
    clearTimeout(timer.current);
    controller.current?.abort();
  }

  // Ref callback cleanup (React 19) cancels pending work on unmount, so no effect is needed.
  const watchUnmount = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    return () => {
      clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, []);

  async function search(term: string) {
    const ctrl = new AbortController();
    controller.current = ctrl;
    setState("loading");
    try {
      const res = await fetch(`/api/teams?search=${encodeURIComponent(term)}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { teams: Team[] };
      setTeams(body.teams);
      setState("done");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState("error");
    }
  }

  // Fetching is driven by the input event itself: debounce + abort live in the handler.
  function handleQueryChange(next: string) {
    setQuery(next);
    cancelPending();
    if (value) {
      setSelected(null);
      onChange(null);
    }
    const term = next.trim();
    if (term.length < 2) {
      setState("idle");
      return;
    }
    timer.current = setTimeout(() => void search(term), DEBOUNCE_MS);
  }

  const tooShort = query.trim().length < 2;

  function pick(team: Team) {
    setSelected(team);
    onChange(team.id);
  }

  return (
    <div ref={watchUnmount} className="flex flex-col gap-2">
      <Label htmlFor="team-search">Time do coração</Label>
      <Input
        id="team-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Busque pelo nome do clube"
        className="h-10"
      />
      {value && selected && (
        <p className="flex items-center gap-2 text-sm font-medium text-primary" aria-live="polite">
          <TeamLogo name={selected.name} src={selected.logo} /> Selecionado: <strong>{selected.name}</strong>
        </p>
      )}
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {tooShort && "Digite ao menos 2 letras"}
        {!tooShort && state === "loading" && "Buscando…"}
        {!tooShort && state === "error" && "Não foi possível buscar clubes. Tente novamente."}
        {!tooShort && state === "done" && teams.length === 0 && "Nenhum clube encontrado"}
      </div>
      {!tooShort && state === "done" && teams.length > 0 && (
        <ul role="listbox" className="flex max-h-64 flex-col overflow-y-auto rounded-lg border bg-card">
          {teams.map((team) => (
            <li key={team.id} role="option" aria-selected={team.id === value}>
              <button
                type="button"
                onClick={() => pick(team)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  team.id === value && "bg-muted font-semibold",
                )}
              >
                <TeamLogo name={team.name} src={team.logo} />
                {team.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
