import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { authConfig } from "@/auth.config";
import { authorizeCredentials, RateLimitedError } from "@/modules/auth/authorize";

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        try {
          return await authorizeCredentials(credentials, ip);
        } catch (error) {
          if (error instanceof RateLimitedError) throw new RateLimitedSignin();
          throw error;
        }
      },
    }),
  ],
});

/** For route handlers: respond 401 when null. */
export async function getCurrentUser(): Promise<{ id: string } | null> {
  const session = await auth();
  return session?.user?.id ? { id: session.user.id } : null;
}

/** For pages/actions: redirects to /login without a session. */
export async function requireUser(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
