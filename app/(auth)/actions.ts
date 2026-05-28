"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn, signOut, auth } from "@/auth";
import { prisma } from "@/server/db/client";
import { EmailService } from "@/server/services/email.service";
import { rateLimit, MINUTE, HOUR } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { env } from "@/lib/env";

const signInSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  callbackUrl: z.string().optional(),
});

const signUpSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(200),
  name: z.string().min(2, "Adınızı yazın").max(120),
  newsletter: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(200),
});

// Password-reset tokens are namespaced in the shared VerificationToken table so
// they never collide with NextAuth's own identifier (the email). Without this
// prefix a magic-link token and a reset token for the same address could clash.
const RESET_IDENTIFIER_PREFIX = "password-reset:";

type ActionResult = { ok: false; error: string; field?: string };

export async function signInAction(raw: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<ActionResult | void> {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: first.path[0] as string };
  }

  // Brute-force guard: 5 attempts/minute keyed by IP + email.
  const ip = await getClientIp();
  const rl = rateLimit(`signin:${ip}:${parsed.data.email}`, 5, MINUTE);
  if (!rl.ok) {
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl || "/account",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // CredentialsSignin = bad email/password. Anything else = config issue.
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "INVALID_CREDENTIALS" };
      }
      return { ok: false, error: err.type };
    }
    // Next.js redirect throws an internal error — let it propagate.
    throw err;
  }
}

export async function signUpAction(raw: {
  email: string;
  password: string;
  name: string;
  newsletter?: boolean;
}): Promise<ActionResult | void> {
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: first.path[0] as string };
  }

  // Abuse guard: 5 sign-ups/minute per IP (stops scripted account creation).
  const ip = await getClientIp();
  const rl = rateLimit(`signup:${ip}`, 5, MINUTE);
  if (!rl.ok) {
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  // Early existence check gives a fast, friendly response in the common case.
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { ok: false, error: "EMAIL_TAKEN", field: "email" };

  const passwordHash = await hash(parsed.data.password, 10);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        role: "CUSTOMER",
        customer: { create: { newsletter: !!parsed.data.newsletter } },
      },
    });
  } catch (err) {
    // Race: a concurrent sign-up slipped in between the findUnique above and
    // this create. Translate the unique-constraint hit into the same friendly
    // error the early check would have produced.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "EMAIL_TAKEN", field: "email" };
    }
    throw err;
  }

  // Welcome email (fail-soft)
  await EmailService.welcome({
    to: user.email,
    name: user.name ?? user.email,
  }).catch(() => undefined);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.type };
    }
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Step 1 of password reset. Always returns the same generic success so an
 * attacker can't probe which emails are registered (email enumeration). Real
 * work — token + email — only happens when the user actually exists.
 */
export async function requestPasswordResetAction(raw: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // 3 requests/hour/IP. Stops someone from spamming the reset mailer.
  const ip = await getClientIp();
  const rl = rateLimit(`forgot-password:${ip}`, 3, HOUR);
  if (!rl.ok) {
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Only send for a real, non-deleted user with a password (Google-only
  // accounts have no passwordHash to reset). Silent no-op otherwise.
  if (user && !user.deletedAt && user.passwordHash) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + HOUR);
    const identifier = `${RESET_IDENTIFIER_PREFIX}${user.id}`;

    // Invalidate any earlier outstanding reset tokens for this user, then issue
    // a fresh one — only the latest link should work.
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({ data: { identifier, token, expires } });

    const resetUrl = `${env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
    await EmailService.passwordReset({ to: user.email, resetUrl }).catch(() => undefined);
  }

  return { ok: true };
}

/**
 * Step 2 of password reset. Validates the token, updates the password hash, and
 * burns the token so it can't be replayed. On success the caller redirects to
 * /sign-in.
 */
export async function resetPasswordAction(raw: {
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // Light abuse guard on token-guessing.
  const ip = await getClientIp();
  const rl = rateLimit(`reset-password:${ip}`, 10, HOUR);
  if (!rl.ok) {
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });

  // Must exist, be a password-reset token, and not be expired.
  if (
    !record ||
    !record.identifier.startsWith(RESET_IDENTIFIER_PREFIX) ||
    record.expires < new Date()
  ) {
    // Clean up an expired token if we found one, so the table doesn't grow.
    if (record) {
      await prisma.verificationToken
        .delete({ where: { token: parsed.data.token } })
        .catch(() => undefined);
    }
    return { ok: false, error: "INVALID_TOKEN" };
  }

  const userId = record.identifier.slice(RESET_IDENTIFIER_PREFIX.length);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    await prisma.verificationToken
      .delete({ where: { token: parsed.data.token } })
      .catch(() => undefined);
    return { ok: false, error: "INVALID_TOKEN" };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Burn the token (and any siblings) so the link can't be reused.
  await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });

  return { ok: true };
}

/**
 * KVKK / GDPR account deletion. Soft-deletes the signed-in user: stamps
 * deletedAt, anonymizes the email (so the personal data is gone but the row can
 * stay for order-history integrity, and the original address frees up for a new
 * sign-up), and turns off the newsletter. Then signs out to /.
 */
export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  // Already gone — just sign out.
  if (existing && !existing.deletedAt) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted-${userId}@efruze.invalid`,
        name: null,
        image: null,
        // Anonymized account can no longer sign in with the old password.
        passwordHash: null,
      },
    });
    // Turn off newsletter if a Customer profile exists (Google-only accounts
    // may not have one, so update-only would throw — keep it best-effort).
    await prisma.customer
      .updateMany({ where: { userId }, data: { newsletter: false } })
      .catch(() => undefined);
  }

  await signOut({ redirectTo: "/" });
}
