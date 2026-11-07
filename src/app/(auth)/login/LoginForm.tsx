"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type FormState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">E-mail</Label>
        <Input id="login-email" name="email" type="email" required autoComplete="email" className="h-10" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Senha</Label>
        <Input id="login-password" name="password" type="password" required autoComplete="current-password" className="h-10" />
      </div>
      {state.error && <p role="alert" aria-live="assertive" className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
      <div className="flex flex-col gap-2 text-sm">
        <a href="/esqueci-senha" className="font-medium text-primary underline underline-offset-4">Esqueci minha senha</a>
        <a href="/cadastro" className="font-medium text-primary underline underline-offset-4">Criar conta</a>
      </div>
    </form>
  );
}
