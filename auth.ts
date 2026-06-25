import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

function resolveEmail(
  user: { email?: string | null },
  profile?: unknown
): string | null {
  if (user.email) return user.email;

  const p = profile as
    | { email?: string; emails?: { value: string }[] }
    | null
    | undefined;

  if (p?.email) return p.email;
  if (p?.emails?.[0]?.value) return p.emails[0].value;
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      const email = resolveEmail(user, profile);
      if (!email) {
        console.error("[auth] signIn denied: missing email", {
          provider: account?.provider,
        });
        return "/login?error=NoEmail";
      }

      user.email = email;

      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const { findOrCreateOAuthUser } = await import("@/lib/users");
          const dbUser = await findOrCreateOAuthUser(
            email,
            user.name ?? email,
            account.provider,
            user.image
          );
          user.id = dbUser.id;
        } catch (error) {
          console.error("[auth] signIn database error:", error);
          return "/login?error=DatabaseError";
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id;
      }
      if (account?.provider === "google" || account?.provider === "github") {
        const { findUserByEmail } = await import("@/lib/users");
        const dbUser = await findUserByEmail(token.email as string);
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
