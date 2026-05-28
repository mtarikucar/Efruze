"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/server/db/client";
import { addressSchema } from "@/server/types/order";

const createAddressInput = addressSchema.extend({
  type: z.enum(["SHIPPING", "BILLING"]),
});

const updateAddressInput = createAddressInput.extend({
  id: z.string().min(1),
});

const deleteAddressInput = z.object({ id: z.string().min(1) });

export async function createAddressAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "UNAUTHORIZED" } as const;
  const parsed = createAddressInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;

  await prisma.address.create({
    data: {
      userId: session.user.id,
      type: parsed.data.type,
      fullName: parsed.data.fullName,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      district: parsed.data.district || null,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      phone: parsed.data.phone || null,
    },
  });
  revalidatePath("/account/addresses");
  return { ok: true } as const;
}

export async function updateAddressAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "UNAUTHORIZED" } as const;
  const parsed = updateAddressInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;

  const existing = await prisma.address.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== session.user.id) {
    return { ok: false, error: "NOT_FOUND" } as const;
  }

  await prisma.address.update({
    where: { id: parsed.data.id },
    data: {
      type: parsed.data.type,
      fullName: parsed.data.fullName,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      district: parsed.data.district || null,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      phone: parsed.data.phone || null,
    },
  });
  revalidatePath("/account/addresses");
  return { ok: true } as const;
}

export async function deleteAddressAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "UNAUTHORIZED" } as const;
  const parsed = deleteAddressInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;

  const existing = await prisma.address.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== session.user.id) {
    return { ok: false, error: "NOT_FOUND" } as const;
  }

  await prisma.address.delete({ where: { id: parsed.data.id } });
  revalidatePath("/account/addresses");
  return { ok: true } as const;
}

const updateProfileInput = z.object({
  name: z.string().min(2, "Adınızı yazın").max(120),
  email: z.string().email("Geçerli bir e-posta girin"),
});

const changePasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Şifre en az 8 karakter olmalı").max(200),
});

export async function updateProfileAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "UNAUTHORIZED" } as const;
  const parsed = updateProfileInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "form" } as const;
  }

  const email = parsed.data.email.toLowerCase();
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name, email },
    });
  } catch (err) {
    // Unique-constraint hit means the new email already belongs to someone else.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "EMAIL_TAKEN", field: "email" } as const;
    }
    throw err;
  }

  revalidatePath("/account/profile");
  revalidatePath("/account");
  return { ok: true } as const;
}

export async function changePasswordAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "UNAUTHORIZED" } as const;
  const parsed = changePasswordInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "newPassword" } as const;
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "UNAUTHORIZED" } as const;
  // Google-only accounts have no password to compare against — guide them to
  // set one via the reset flow instead of failing opaquely.
  if (!user.passwordHash) return { ok: false, error: "NO_PASSWORD" } as const;

  const ok = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "WRONG_PASSWORD", field: "currentPassword" } as const;

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });
  return { ok: true } as const;
}
