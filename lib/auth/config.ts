import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";

// For email/password authentication, you'll need a User model
// This is a placeholder - you can create a User model later if needed
interface User {
  id: string;
  email: string;
  name?: string;
  password?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await connectDB();

          // TODO: Replace with actual User model query
          // For now, this is a placeholder
          // const user = await User.findOne({ email: credentials.email });
          // if (!user || !user.password) {
          //   throw new Error("Invalid email or password");
          // }
          // const isPasswordValid = await bcrypt.compare(
          //   credentials.password,
          //   user.password
          // );
          // if (!isPasswordValid) {
          //   throw new Error("Invalid email or password");
          // }
          // return {
          //   id: user._id.toString(),
          //   email: user.email,
          //   name: user.name,
          // };

          // Placeholder return - remove when User model is implemented
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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

