import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/server/email";
import { hashPassword } from "./password";

export class InvalidTokenError extends Error {
  constructor() {
    super("invalid_token");
  }
}

const TOKEN_TTL_MS = 60 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function resetLink(token: string): string {
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/redefinir-senha?token=${token}`;
}

/** Always resolves the same way, whether or not the email exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true },
  });
  if (!user) return;

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  await sendEmail(
    user.email,
    "Redefinição de senha — Arquibancada",
    `Use o link abaixo para redefinir sua senha (válido por 1 hora):\n\n${resetLink(token)}\n\nSe não foi você, ignore este e-mail.`,
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = sha256(token);
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    const now = new Date();
    // Atomic claim: only one concurrent caller can flip usedAt from null.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) throw new InvalidTokenError();
    const row = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    // Any other outstanding links for this user die with the password change.
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    });
  });
}
