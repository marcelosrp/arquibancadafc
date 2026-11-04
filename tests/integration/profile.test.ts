import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const currentUser = vi.hoisted(() => ({ value: null as { id: string } | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => currentUser.value }));

import { GET, PATCH } from "@/app/api/me/route";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/modules/auth/password";

let userId: string;
let otherId: string;
let teamId: string;
let otherTeamId: string;

beforeEach(async () => {
  const t1 = await prisma.team.create({ data: { externalId: 127, name: "Flamengo", country: "Brazil" } });
  const t2 = await prisma.team.create({ data: { externalId: 121, name: "Palmeiras", country: "Brazil" } });
  teamId = t1.id;
  otherTeamId = t2.id;
  const passwordHash = await hashPassword("senha-atual-1");
  userId = (await prisma.user.create({ data: { name: "Maria", email: "maria@x.com", passwordHash, favoriteTeamId: teamId } })).id;
  otherId = (await prisma.user.create({ data: { name: "Joao", email: "joao@x.com", passwordHash, favoriteTeamId: otherTeamId } })).id;
  currentUser.value = { id: userId };
});

const patch = (body: unknown) =>
  PATCH(new NextRequest("http://x/api/me", { method: "PATCH", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));

describe("GET /api/me", () => {
  it("returns 401 without a session", async () => {
    currentUser.value = null;
    expect((await GET()).status).toBe(401);
  });

  it("returns only the signed-in user's data, without the hash", async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ id: userId, name: "Maria", email: "maria@x.com", favoriteTeam: { name: "Flamengo" } });
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });
});

describe("PATCH /api/me", () => {
  it("returns 401 without a session", async () => {
    currentUser.value = null;
    expect((await patch({ name: "X Y" })).status).toBe(401);
  });

  it("rejects favoriteTeamId with 400 and leaves the team unchanged", async () => {
    const res = await patch({ favoriteTeamId: otherTeamId });
    expect(res.status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).favoriteTeamId).toBe(teamId);
  });

  it("rejects favoriteTeamId even alongside a valid name change, applying nothing", async () => {
    expect((await patch({ name: "Novo Nome", favoriteTeamId: otherTeamId })).status).toBe(400);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).name).toBe("Maria");
  });

  it("updates the name", async () => {
    expect((await patch({ name: "Maria Silva" })).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).name).toBe("Maria Silva");
  });

  it("requires the correct current password to change the password", async () => {
    const wrong = await patch({ currentPassword: "errada-123", newPassword: "nova-senha-1" });
    expect(wrong.status).toBe(400);
    expect((await wrong.json()).error).toBe("invalid_current_password");
    const missing = await patch({ newPassword: "nova-senha-1" });
    expect(missing.status).toBe(400);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword("senha-atual-1", stored.passwordHash)).toBe(true);
  });

  it("changes the password when the current one is correct", async () => {
    const res = await patch({ currentPassword: "senha-atual-1", newPassword: "nova-senha-1" });
    expect(res.status).toBe(200);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword("nova-senha-1", stored.passwordHash)).toBe(true);
  });

  it("rejects a short new password", async () => {
    expect((await patch({ currentPassword: "senha-atual-1", newPassword: "curta" })).status).toBe(400);
  });

  it("rejects attempts to target another user or change the email", async () => {
    expect((await patch({ name: "Maria Silva", email: "hacker@x.com", id: otherId })).status).toBe(400);
    const other = await prisma.user.findUniqueOrThrow({ where: { id: otherId } });
    expect(other.name).toBe("Joao");
    expect(other.email).toBe("joao@x.com");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).email).toBe("maria@x.com");
  });
});
