"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type FormState } from "../actions";

const inputClass = "h-9 rounded-md border bg-transparent px-3 text-sm";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        E-mail
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Senha
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
      <a href="/esqueci-senha" className="text-sm underline">Esqueci minha senha</a>
      <a href="/cadastro" className="text-sm underline">Criar conta</a>
    </form>
  );
}
