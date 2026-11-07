"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamPicker } from "@/components/teams/TeamPicker";
import { signUpAction, type FormState } from "../actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  const [teamId, setTeamId] = useState<string | null>(null);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-name">Nome</Label>
        <Input id="signup-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="h-10" />
        {fe.name && <span role="alert" className="text-sm font-medium text-destructive">Nome deve ter de 2 a 80 caracteres.</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">E-mail</Label>
        <Input id="signup-email" name="email" type="email" required autoComplete="email" className="h-10" />
        {fe.email && <span role="alert" className="text-sm font-medium text-destructive">E-mail inválido.</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">Senha</Label>
        <Input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" aria-describedby="signup-password-hint" className="h-10" />
        <span id="signup-password-hint" className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span>
        {fe.password && <span role="alert" className="text-sm font-medium text-destructive">Senha deve ter ao menos 8 caracteres.</span>}
      </div>
      <TeamPicker value={teamId} onChange={setTeamId} />
      <p className="text-xs text-muted-foreground">O clube não pode ser alterado depois do cadastro.</p>
      <input type="hidden" name="favoriteTeamId" value={teamId ?? ""} />
      {fe.favoriteTeamId && <span role="alert" className="text-sm font-medium text-destructive">Escolha um clube.</span>}
      {state.error && <p role="alert" aria-live="assertive" className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending || !teamId}>
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
      <a href="/login" className="text-sm font-medium text-primary underline underline-offset-4">Já tenho conta</a>
    </form>
  );
}
