"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newPassword = String(new FormData(event.currentTarget).get("newPassword") ?? "");
    setStatus("pending");
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (res.ok) return setStatus("done");
    const body = await res.json().catch(() => ({}));
    setMessage(
      body.error === "invalid_token"
        ? "Link inválido ou expirado. Solicite um novo."
        : res.status === 429
          ? "Muitas tentativas. Tente novamente mais tarde."
          : "A senha deve ter pelo menos 8 caracteres.",
    );
    setStatus("error");
  }

  if (status === "done") {
    return (
      <div role="status" className="flex flex-col gap-2 text-sm">
        <p>Senha redefinida com sucesso.</p>
        <a href="/login" className="font-medium text-primary underline underline-offset-4">Entrar</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">Nova senha</Label>
        <Input id="reset-password" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="h-10" />
      </div>
      {status === "error" && <p role="alert" aria-live="assertive" className="text-sm font-medium text-destructive">{message}</p>}
      <Button type="submit" size="lg" disabled={status === "pending"}>
        {status === "pending" ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
