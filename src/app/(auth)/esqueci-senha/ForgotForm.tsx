"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotForm() {
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setStatus("pending");
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) return setStatus("sent");
    setMessage(res.status === 429 ? "Muitas tentativas. Tente novamente mais tarde." : "Informe um e-mail válido.");
    setStatus("error");
  }

  if (status === "sent") {
    return (
      <p role="status" className="text-sm">
        Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">E-mail</Label>
        <Input id="forgot-email" name="email" type="email" required autoComplete="email" className="h-10" />
      </div>
      {status === "error" && <p role="alert" aria-live="assertive" className="text-sm font-medium text-destructive">{message}</p>}
      <Button type="submit" size="lg" disabled={status === "pending"}>
        {status === "pending" ? "Enviando…" : "Enviar link"}
      </Button>
      <a href="/login" className="text-sm font-medium text-primary underline underline-offset-4">Voltar ao login</a>
    </form>
  );
}
