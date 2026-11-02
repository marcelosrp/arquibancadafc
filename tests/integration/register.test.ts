import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/modules/auth/password";
import { EmailTakenError, registerUser, TeamNotFoundError } from "@/modules/auth/register";

let teamId: string;

beforeEach(async () => {
  const team = await prisma.team.create({
    data: { externalId: 127, name: "Flamengo", country: "Brazil" },
  });
  teamId = team.id;
});

const input = (over: Record<string, unknown> = {}) => ({
  name: "Maria",
  email: "maria@x.com",
  password: "senha-segura-1",
  favoriteTeamId: teamId,
  ...over,
});

describe("registerUser", () => {
  it("stores a hash, not the password", async () => {
    const { id } = await registerUser(input());
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(user.passwordHash).not.toBe("senha-segura-1");
    expect(await verifyPassword("senha-segura-1", user.passwordHash)).toBe(true);
  });

  it("treats emails case-insensitively", async () => {
    await registerUser(input({ email: "A@X.com" }));
    await expect(registerUser(input({ email: "a@x.com" }))).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("rejects an unknown team", async () => {
    await expect(
      registerUser(input({ favoriteTeamId: "11111111-1111-4111-8111-111111111111" })),
    ).rejects.toBeInstanceOf(TeamNotFoundError);
  });
});

describe("POST /api/auth/register", () => {
  const post = (body: unknown) =>
    POST(
      new NextRequest("http://x/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
      }),
    );

  it("returns 400 with zod issues for an invalid payload", async () => {
    const res = await post(input({ password: "123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).issues.fieldErrors.password).toBeDefined();
  });

  it("returns 409 for a duplicated email", async () => {
    expect((await post(input())).status).toBe(201);
    expect((await post(input({ email: "MARIA@x.com" }))).status).toBe(409);
  });
});
