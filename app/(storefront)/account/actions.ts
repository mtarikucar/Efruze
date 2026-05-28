"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
