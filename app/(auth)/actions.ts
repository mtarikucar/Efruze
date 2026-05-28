"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/server/db/client";
import { EmailService } from "@/server/services/email.service";

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

export async function deleteAccountAction() {
  // M3 doesn't surface this in UI; M8 will. Stubbed for completeness.
  redirect("/account");
}
