"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { TeamPicker } from "@/components/teams/TeamPicker";
import { signUpAction, type FormState } from "../actions";

const inputClass = "h-9 rounded-md border bg-transparent px-3 text-sm";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  const [teamId, setTeamId] = useState<string | null>(null);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nome
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={inputClass} />
        {fe.name && <span role="alert" className="text-destructive">Nome deve ter de 2 a 80 caracteres.</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        E-mail
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
        {fe.email && <span role="alert" className="text-destructive">E-mail inválido.</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Senha
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        <span className="text-xs font-normal text-muted-foreground">Mínimo de 8 caracteres.</span>
        {fe.password && <span role="alert" className="text-destructive">Senha deve ter ao menos 8 caracteres.</span>}
      </label>
      <TeamPicker value={teamId} onChange={setTeamId} />
      <p className="text-xs text-muted-foreground">O clube não pode ser alterado depois do cadastro.</p>
      <input type="hidden" name="favoriteTeamId" value={teamId ?? ""} />
      {fe.favoriteTeamId && <span role="alert" className="text-sm text-destructive">Escolha um clube.</span>}
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending || !teamId}>
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
      <a href="/login" className="text-sm underline">Já tenho conta</a>
    </form>
  );
}
