"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass = "h-9 rounded-md border bg-transparent px-3 text-sm";

export function ProfileForm({ name }: { name: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: Record<string, string> = { name: String(data.get("name") ?? "") };
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword) {
      body.newPassword = newPassword;
      body.currentPassword = String(data.get("currentPassword") ?? "");
    }
    setStatus("pending");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      form.reset();
      return setStatus("saved");
    }
    const err = await res.json().catch(() => ({}));
    setMessage(
      err.error === "invalid_current_password"
        ? "Senha atual incorreta."
        : res.status === 429
          ? "Muitas tentativas. Tente novamente em alguns minutos."
          : "Confira os dados: nome de 2 a 80 caracteres e nova senha com 8 ou mais.",
    );
    setStatus("error");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nome
        <input name="name" defaultValue={name} required minLength={2} maxLength={80} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Senha atual
        <input name="currentPassword" type="password" autoComplete="current-password" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nova senha
        <input name="newPassword" type="password" minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
      {status === "saved" && <p role="status" className="text-sm">Perfil atualizado.</p>}
      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
