import type { NextAuthConfig } from "next-auth";

const PROTECTED = ["/dashboard", "/competicoes", "/perfil"];
const GUEST_ONLY = ["/login", "/cadastro"];

const matches = (path: string, bases: string[]) =>
  bases.some((base) => path === base || path.startsWith(`${base}/`));

/** Edge/proxy-safe config: no providers, Prisma or argon2 imports. */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const loggedIn = !!auth?.user;
      if (matches(pathname, PROTECTED)) return loggedIn;
      if (loggedIn && matches(pathname, GUEST_ONLY)) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
