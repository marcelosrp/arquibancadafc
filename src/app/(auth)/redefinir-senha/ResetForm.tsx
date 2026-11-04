"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass = "h-9 rounded-md border bg-transparent px-3 text-sm";

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
      <div role="status" className="flex max-w-sm flex-col gap-2 text-sm">
        <p>Senha redefinida com sucesso.</p>
        <a href="/login" className="underline">Entrar</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nova senha
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
