import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/server/db/client";
import { CartService } from "@/server/services/cart.service";
import { CART_COOKIE } from "@/lib/constants";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

/**
 * Pre-computed bcrypt hash used to keep `authorize()` in constant time when the
 * email doesn't exist. Without this, "no such user" returns in ~5ms (DB miss),
 * but "wrong password" returns in ~80ms (bcrypt compare), letting an attacker
 * enumerate valid emails by timing the response. Compared against the user's
 * actual password, this dummy never matches.
 */
const DUMMY_HASH_PROMISE: Promise<string> = hash(
  "efruze::no-user::never-matches",
  10,
);

function buildProviders() {
  const list: NextAuthConfig["providers"] = [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { type: "email", label: "Email" },
        password: { type: "password", label: "Password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        // Always run bcrypt — dummy hash when the user doesn't exist — so
        // attackers can't enumerate emails via response timing.
        const hashToCompare = user?.passwordHash ?? (await DUMMY_HASH_PROMISE);
        const ok = await compare(parsed.data.password, hashToCompare);
        if (!user || !user.passwordHash || !ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ];

  // Conditionally enable Google when env vars are present so the button only
  // appears in environments that can complete the OAuth round-trip.
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    list.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  return list;
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: buildProviders(),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 days
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as typeof session.user.role) ?? "CUSTOMER";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Merge anonymous cart into the user's cart on every sign-in.
      // Fails-soft: never block sign-in if merge errors.
      if (!user?.id) return;
      try {
        const c = await cookies();
        const anonToken = c.get(CART_COOKIE)?.value;
        if (!anonToken) return;
        await CartService.merge(anonToken, user.id);
      } catch (err) {
        console.error("[auth.events.signIn] cart merge failed", err);
      }
    },
  },
};
