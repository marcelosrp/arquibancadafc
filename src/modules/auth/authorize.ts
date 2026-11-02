import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/server/rate-limit";
import { hashPassword, verifyPassword } from "./password";
import { loginSchema } from "./schemas";

export class RateLimitedError extends Error {
  constructor() {
    super("rate_limited");
  }
}

const WINDOW_SEC = 15 * 60;

// Verified against when the user does not exist, so timing doesn't reveal it.
let dummyHash: Promise<string> | undefined;

export async function authorizeCredentials(
  raw: unknown,
  ip: string,
): Promise<{ id: string; name: string; email: string } | null> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 20, WINDOW_SEC),
    rateLimit(`login:email:${email}`, 5, WINDOW_SEC),
  ]);
  if (!byIp.allowed || !byEmail.allowed) throw new RateLimitedError();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    dummyHash ??= hashPassword("dummy-password-for-timing");
    await verifyPassword(password, await dummyHash);
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email };
}
