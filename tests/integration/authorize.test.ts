import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { authorizeCredentials, RateLimitedError } from "@/modules/auth/authorize";
import { registerUser } from "@/modules/auth/register";

beforeEach(async () => {
  const team = await prisma.team.create({
    data: { externalId: 127, name: "Flamengo", country: "Brazil" },
  });
  await registerUser({
    name: "Maria",
    email: "maria@x.com",
    password: "senha-segura-1",
    favoriteTeamId: team.id,
  });
});

describe("authorizeCredentials", () => {
  it("accepts right credentials, any email case", async () => {
    const user = await authorizeCredentials({ email: "MARIA@x.com", password: "senha-segura-1" }, "1.1.1.1");
    expect(user?.email).toBe("maria@x.com");
  });

  it("returns null for wrong password or unknown user", async () => {
    expect(await authorizeCredentials({ email: "maria@x.com", password: "errada-123" }, "1.1.1.1")).toBeNull();
    expect(await authorizeCredentials({ email: "x@x.com", password: "senha-segura-1" }, "1.1.1.1")).toBeNull();
  });

  it("returns null for malformed input", async () => {
    expect(await authorizeCredentials({}, "1.1.1.1")).toBeNull();
  });

  it("rate limits after 5 attempts on the same email", async () => {
    for (let i = 0; i < 5; i++) {
      await authorizeCredentials({ email: "maria@x.com", password: "errada-123" }, `9.9.9.${i}`);
    }
    await expect(
      authorizeCredentials({ email: "maria@x.com", password: "senha-segura-1" }, "9.9.9.9"),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});
