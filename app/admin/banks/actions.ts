"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";

const bankSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().min(1).max(120),
  accountHolder: z.string().min(1).max(200),
  iban: z.string().min(8).max(64),
  swift: z.string().max(40).optional().or(z.literal("")),
  currency: z.string().length(3).default("TRY"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
});

export async function upsertBankAction(raw: unknown) {
  await requireAdmin();
  const parsed = bankSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" } as const;
  const data = {
    bankName: parsed.data.bankName,
    accountHolder: parsed.data.accountHolder,
    iban: parsed.data.iban,
    swift: parsed.data.swift || null,
    currency: parsed.data.currency,
    isActive: parsed.data.isActive,
    sortOrder: parsed.data.sortOrder,
  };
  try {
    if (parsed.data.id) {
      await prisma.bankAccount.update({ where: { id: parsed.data.id }, data });
    } else {
      await prisma.bankAccount.create({ data });
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/banks");
  return { ok: true } as const;
}

export async function deleteBankAction(raw: unknown) {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" } as const;
  try {
    await prisma.bankAccount.delete({ where: { id: parsed.data.id } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/banks");
  return { ok: true } as const;
}
