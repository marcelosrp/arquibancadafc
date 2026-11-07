"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={name} required minLength={2} maxLength={80} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Senha atual</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" name="newPassword" type="password" minLength={8} autoComplete="new-password" />
      </div>
      {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
      {status === "saved" && <p role="status" className="text-sm">Perfil atualizado.</p>}
      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
