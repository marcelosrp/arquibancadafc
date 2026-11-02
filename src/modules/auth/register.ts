import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "./password";
import { registerSchema, type RegisterInput } from "./schemas";

export class EmailTakenError extends Error {
  constructor() {
    super("email_taken");
  }
}

export class TeamNotFoundError extends Error {
  constructor() {
    super("team_not_found");
  }
}

export async function registerUser(input: RegisterInput): Promise<{ id: string }> {
  // Re-normalizes so direct callers get the same email rules as the HTTP route.
  const { name, email, password, favoriteTeamId } = registerSchema.parse(input);

  const team = await prisma.team.findUnique({ where: { id: favoriteTeamId }, select: { id: true } });
  if (!team) throw new TeamNotFoundError();

  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, favoriteTeamId },
      select: { id: true },
    });
    return { id: user.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailTakenError();
    }
    throw error;
  }
}
