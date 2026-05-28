"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";

const createSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

/**
 * Create a brand-new admin: a User row (bcrypt-hashed password) plus the
 * companion Admin row, in one transaction. Unique-email collisions (P2002)
 * are surfaced as a friendly error. SUPER_ADMIN only.
 */
export async function createAdminAction(raw: unknown) {
  await requireSuperAdmin();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" } as const;
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hash(parsed.data.password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role,
        admin: { create: {} },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Bu e-posta zaten kayıtlı." } as const;
    }
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }

  revalidatePath("/admin/users");
  return { ok: true } as const;
}

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "SUPER_ADMIN", "CUSTOMER"]),
});

/**
 * Change a user's role between CUSTOMER / ADMIN / SUPER_ADMIN. Guards:
 *  - you cannot demote yourself (prevents locking yourself out);
 *  - you cannot demote the last remaining SUPER_ADMIN.
 * Keeps the Admin companion row in sync with the target role.
 */
export async function changeRoleAction(raw: unknown) {
  const session = await requireSuperAdmin();
  const parsed = changeRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" } as const;
  }

  const { userId, role } = parsed.data;

  // Block self-demotion away from SUPER_ADMIN.
  if (userId === session.user.id && role !== "SUPER_ADMIN") {
    return { ok: false, error: "Kendi yetkinizi düşüremezsiniz." } as const;
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." } as const;

  // Last-super-admin protection: never let the final SUPER_ADMIN be downgraded.
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) {
      return { ok: false, error: "Son süper yöneticinin yetkisi düşürülemez." } as const;
    }
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { role } });
    // Keep Admin companion row consistent with the new role.
    if (role === "CUSTOMER") {
      await prisma.admin.deleteMany({ where: { userId } });
    } else {
      const exists = await prisma.admin.findUnique({ where: { userId } });
      if (!exists) await prisma.admin.create({ data: { userId } });
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }

  revalidatePath("/admin/users");
  return { ok: true } as const;
}

const removeSchema = z.object({ userId: z.string().min(1) });

/**
 * Strip admin privileges from a user (role → CUSTOMER, drop the Admin row).
 * Guards against removing yourself and against removing the last SUPER_ADMIN.
 */
export async function removeAdminAction(raw: unknown) {
  const session = await requireSuperAdmin();
  const parsed = removeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" } as const;

  const { userId } = parsed.data;

  if (userId === session.user.id) {
    return { ok: false, error: "Kendi yöneticiliğinizi kaldıramazsınız." } as const;
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: "Kullanıcı bulunamadı." } as const;

  if (target.role === "SUPER_ADMIN") {
    const superCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) {
      return { ok: false, error: "Son süper yönetici kaldırılamaz." } as const;
    }
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER" } });
    await prisma.admin.deleteMany({ where: { userId } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }

  revalidatePath("/admin/users");
  return { ok: true } as const;
}
