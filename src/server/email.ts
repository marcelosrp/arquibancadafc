import { env } from "@/lib/env";

const FROM = "Arquibancada <onboarding@resend.dev>";

/**
 * Sends a plain-text email through Resend. Without RESEND_API_KEY (local dev)
 * the message is logged to the console instead, so reset links stay usable.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`email_send_failed:${res.status}`);
}
