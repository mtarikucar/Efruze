"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";

const settingsSchema = z.object({
  brandName: z.string().min(1).max(120),
  taglineTr: z.string().min(1).max(200),
  taglineEn: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  whatsapp: z.string().max(40).optional().or(z.literal("")),
  instagram: z.string().max(80).optional().or(z.literal("")),
  defaultCurrency: z.string().length(3).default("TRY"),
  shippingFlatRate: z.string().refine((v) => !Number.isNaN(Number(v)), "Invalid"),
  freeShippingThreshold: z.string().optional().or(z.literal("")),
  addressTr: z.string().max(2000).optional().or(z.literal("")),
  addressEn: z.string().max(2000).optional().or(z.literal("")),
  hoursTr: z.string().max(1000).optional().or(z.literal("")),
  hoursEn: z.string().max(1000).optional().or(z.literal("")),
});

export async function updateSettingsAction(raw: unknown) {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" } as const;
  try {
    await prisma.storeSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        brandName: parsed.data.brandName,
        tagline: {
          tr: parsed.data.taglineTr,
          en: parsed.data.taglineEn,
        } as Prisma.InputJsonValue,
        contactEmail: parsed.data.contactEmail,
        whatsapp: parsed.data.whatsapp || null,
        instagram: parsed.data.instagram || null,
        defaultCurrency: parsed.data.defaultCurrency,
        shippingFlatRate: new Prisma.Decimal(parsed.data.shippingFlatRate),
        freeShippingThreshold: parsed.data.freeShippingThreshold
          ? new Prisma.Decimal(parsed.data.freeShippingThreshold)
          : null,
        addressTr: parsed.data.addressTr || null,
        addressEn: parsed.data.addressEn || null,
        hoursTr: parsed.data.hoursTr || null,
        hoursEn: parsed.data.hoursEn || null,
      },
      update: {
        brandName: parsed.data.brandName,
        tagline: {
          tr: parsed.data.taglineTr,
          en: parsed.data.taglineEn,
        } as Prisma.InputJsonValue,
        contactEmail: parsed.data.contactEmail,
        whatsapp: parsed.data.whatsapp || null,
        instagram: parsed.data.instagram || null,
        defaultCurrency: parsed.data.defaultCurrency,
        shippingFlatRate: new Prisma.Decimal(parsed.data.shippingFlatRate),
        freeShippingThreshold: parsed.data.freeShippingThreshold
          ? new Prisma.Decimal(parsed.data.freeShippingThreshold)
          : null,
        addressTr: parsed.data.addressTr || null,
        addressEn: parsed.data.addressEn || null,
        hoursTr: parsed.data.hoursTr || null,
        hoursEn: parsed.data.hoursEn || null,
      },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/contact");
  return { ok: true } as const;
}
