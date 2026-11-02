"use client";

import { useCallback, useRef, useState } from "react";
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
      <label htmlFor="team-search" className="text-sm font-medium">
        Time do coração
      </label>
      <input
        id="team-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Busque pelo nome do clube"
        className="h-9 rounded-md border bg-transparent px-3 text-sm"
      />
      {value && selected && (
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
          <TeamLogo team={selected} /> Selecionado: <strong>{selected.name}</strong>
        </p>
      )}
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {tooShort && "Digite ao menos 2 letras"}
        {!tooShort && state === "loading" && "Buscando…"}
        {!tooShort && state === "error" && "Não foi possível buscar clubes. Tente novamente."}
        {!tooShort && state === "done" && teams.length === 0 && "Nenhum clube encontrado"}
      </div>
      {!tooShort && state === "done" && teams.length > 0 && (
        <ul role="listbox" className="flex flex-col rounded-md border">
          {teams.map((team) => (
            <li key={team.id} role="option" aria-selected={team.id === value}>
              <button
                type="button"
                onClick={() => pick(team)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                  team.id === value && "bg-muted font-medium",
                )}
              >
                <TeamLogo team={team} />
                {team.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamLogo({ team }: { team: Team }) {
  return team.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={team.logo} alt={`Escudo do ${team.name}`} className="size-6 object-contain" />
  ) : (
    <span aria-hidden className="inline-block size-6 rounded-full bg-muted" />
  );
}
