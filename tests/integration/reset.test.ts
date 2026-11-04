import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.hoisted(() => vi.fn<(to: string, subject: string, text: string) => Promise<void>>(async () => {}));
vi.mock("@/server/email", () => ({ sendEmail }));

import { POST as forgot } from "@/app/api/auth/forgot/route";
import { POST as reset } from "@/app/api/auth/reset/route";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import { InvalidTokenError, requestPasswordReset, resetPassword } from "@/modules/auth/reset";

let userId: string;

beforeEach(async () => {
  sendEmail.mockClear();
  const team = await prisma.team.create({ data: { externalId: 127, name: "Flamengo", country: "Brazil" } });
  userId = (
    await prisma.user.create({
      data: { name: "Maria", email: "maria@x.com", passwordHash: await hashPassword("senha-antiga-1"), favoriteTeamId: team.id },
    })
  ).id;
});

afterEach(() => vi.useRealTimers());

/** Extracts the raw token from the link in the first email sent. */
function sentToken(): string {
  const text = sendEmail.mock.calls[0][2];
  const match = /token=([A-Za-z0-9_-]+)/.exec(text);
  if (!match) throw new Error("no token in email");
  return match[1];
}

describe("requestPasswordReset", () => {
  it("emails a link and stores only the SHA-256 hash of the token, expiring in 1h", async () => {
    await requestPasswordReset("MARIA@x.com");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toBe("maria@x.com");
    const token = sentToken();
    const rows = await prisma.passwordResetToken.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(rows[0].tokenHash).not.toContain(token);
    const ttl = rows[0].expiresAt.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(59 * 60_000);
    expect(ttl).toBeLessThanOrEqual(60 * 60_000);
  });

  it("resolves the same way for an unknown email, sending nothing and storing nothing", async () => {
    await expect(requestPasswordReset("ninguem@x.com")).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await prisma.passwordResetToken.count()).toBe(0);
  });
});

describe("resetPassword", () => {
  it("sets the new password and works only once", async () => {
    await requestPasswordReset("maria@x.com");
    const token = sentToken();
    await resetPassword(token, "senha-nova-123");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword("senha-nova-123", user.passwordHash)).toBe(true);
    await expect(resetPassword(token, "outra-senha-123")).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it("fails for an expired token", async () => {
    await requestPasswordReset("maria@x.com");
    const token = sentToken();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 61 * 60_000);
    await expect(resetPassword(token, "senha-nova-123")).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it("fails for an unknown token", async () => {
    await expect(resetPassword("nao-existe", "senha-nova-123")).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it("lets only one of two concurrent uses succeed", async () => {
    await requestPasswordReset("maria@x.com");
    const token = sentToken();
    const results = await Promise.allSettled([
      resetPassword(token, "senha-nova-123"),
      resetPassword(token, "senha-nova-456"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
});

const json = (url: string, body: unknown, ip = "1.2.3.4") =>
  new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });

describe("POST /api/auth/forgot", () => {
  it("gives the same response for existing and unknown emails", async () => {
    const a = await forgot(json("http://x/api/auth/forgot", { email: "maria@x.com" }));
    const b = await forgot(json("http://x/api/auth/forgot", { email: "ninguem@x.com" }));
    expect(a.status).toBe(b.status);
    expect(await a.json()).toEqual(await b.json());
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for a malformed email", async () => {
    expect((await forgot(json("http://x/api/auth/forgot", { email: "x" }))).status).toBe(400);
  });

  it("rate limits per IP", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await forgot(json("http://x/api/auth/forgot", { email: `u${i}@x.com` }, "9.9.9.9"))).status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });

  it("caps emails per address across different IPs, with an identical response", async () => {
    const responses: { status: number; body: unknown }[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await forgot(json("http://x/api/auth/forgot", { email: "maria@x.com" }, `8.8.8.${i}`));
      responses.push({ status: res.status, body: await res.json() });
    }
    expect(new Set(responses.map((r) => JSON.stringify(r))).size).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });
});

describe("POST /api/auth/reset", () => {
  it("resets with a valid token and returns 400 for a reused one", async () => {
    await requestPasswordReset("maria@x.com");
    const token = sentToken();
    expect((await reset(json("http://x/api/auth/reset", { token, newPassword: "senha-nova-123" }))).status).toBe(200);
    const again = await reset(json("http://x/api/auth/reset", { token, newPassword: "senha-nova-123" }));
    expect(again.status).toBe(400);
    expect((await again.json()).error).toBe("invalid_token");
  });

  it("returns 400 validation for a short password", async () => {
    expect((await reset(json("http://x/api/auth/reset", { token: "abc", newPassword: "curta" }))).status).toBe(400);
  });
});
