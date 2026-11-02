import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import { registerSchema } from "@/modules/auth/schemas";

const TEAM_ID = "11111111-1111-4111-8111-111111111111";

describe("password hashing", () => {
  it("produces an argon2id hash different from the plain text", async () => {
    const hash = await hashPassword("senha-segura-1");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toBe("senha-segura-1");
  });

  it("verifies right and wrong passwords", async () => {
    const hash = await hashPassword("senha-segura-1");
    expect(await verifyPassword("senha-segura-1", hash)).toBe(true);
    expect(await verifyPassword("outra-senha-1", hash)).toBe(false);
  });

  it("returns false for a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = { name: "Maria", email: "A@X.com", password: "12345678", favoriteTeamId: TEAM_ID };

  it("lowercases and trims the email", () => {
    expect(registerSchema.parse({ ...valid, email: "  A@X.com " }).email).toBe("a@x.com");
  });

  it("rejects a 7-character password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
  });

  it("rejects short names and non-uuid team ids", () => {
    expect(registerSchema.safeParse({ ...valid, name: "M" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, favoriteTeamId: "abc" }).success).toBe(false);
  });
});
