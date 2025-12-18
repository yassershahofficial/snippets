import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findOrCreateUser } from "@/lib/auth/user";

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowed(email: string): boolean {
  const allowedEmails = parseCsvEnv(process.env.NEXTAUTH_ALLOWED_EMAILS);
  const allowedDomains = parseCsvEnv(process.env.NEXTAUTH_ALLOWED_DOMAINS);

  // Backwards-compatible: if no allowlist is configured, allow everyone.
  if (allowedEmails.length === 0 && allowedDomains.length === 0) return true;

  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] || "";

  if (allowedEmails.includes(normalized)) return true;
  if (domain && allowedDomains.includes(domain)) return true;

  return false;
}

function getEmailVerifiedFromProfile(profile: unknown): boolean | undefined {
  if (!profile || typeof profile !== "object") return undefined;
  // NextAuth's Google profile typically includes `email_verified`, but keep it defensive.
  const maybe = profile as Record<string, unknown>;
  return typeof maybe.email_verified === "boolean" ? maybe.email_verified : undefined;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && account.providerAccountId && user.email) {
        const requireVerified = (process.env.NEXTAUTH_REQUIRE_VERIFIED_EMAIL ?? "true")
          .trim()
          .toLowerCase() !== "false";

        const emailVerifiedFromProfile = getEmailVerifiedFromProfile(profile);
        const emailVerified = emailVerifiedFromProfile ?? true;

        if (requireVerified && !emailVerified) return false;
        if (!isEmailAllowed(user.email)) return false;

        try {
          // Save or update user in MongoDB
          const dbUser = await findOrCreateUser({
            sub: account.providerAccountId,
            email: user.email,
            name: user.name || undefined,
            picture: user.image || undefined,
          });

          // Update user object with database ID
          user.id = dbUser._id;
        } catch (error) {
          console.error("Error saving user to database:", error);
          // Allow sign-in to continue even if DB save fails
          // User will still be authenticated via JWT
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - user object is available
      if (user && account?.provider === "google" && account.providerAccountId) {
        try {
          // Ensure user is saved to database
          const dbUser = await findOrCreateUser({
            sub: account.providerAccountId,
            email: user.email!,
            name: user.name || undefined,
            picture: user.image || undefined,
          });
          token.id = dbUser._id;
          token.email = user.email;
          token.name = user.name;
        } catch (error) {
          console.error("Error in JWT callback:", error);
          // Fallback to user object if DB save fails
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
      } else if (user) {
        // Fallback for non-Google providers (shouldn't happen in current setup)
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

