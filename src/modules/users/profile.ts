import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/modules/auth/password";

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super("invalid_current_password");
  }
}

/** Strict: unknown keys (favoriteTeamId, email, id...) are a validation error. */
export const updateProfileSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(80).optional(),
    currentPassword: z.string().min(1).max(128).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine((v) => v.newPassword === undefined || v.currentPassword !== undefined, {
    path: ["currentPassword"],
    message: "required_to_change_password",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function getProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      favoriteTeam: { select: { id: true, name: true, logo: true } },
    },
  });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: { name?: string; passwordHash?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.newPassword !== undefined) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!(await verifyPassword(input.currentPassword ?? "", user.passwordHash))) {
      throw new InvalidCurrentPasswordError();
    }
    data.passwordHash = await hashPassword(input.newPassword);
  }
  if (Object.keys(data).length > 0) await prisma.user.update({ where: { id: userId }, data });
  return getProfile(userId);
}
