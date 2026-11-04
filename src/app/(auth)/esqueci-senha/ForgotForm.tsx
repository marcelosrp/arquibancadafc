"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass = "h-9 rounded-md border bg-transparent px-3 text-sm";

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
      <p role="status" className="max-w-sm text-sm">
        Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        E-mail
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      {status === "error" && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Enviando…" : "Enviar link"}
      </Button>
      <a href="/login" className="text-sm underline">Voltar ao login</a>
    </form>
  );
}
